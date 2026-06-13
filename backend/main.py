"""旧书页眉批摘录库 API。"""

import csv
import io
from datetime import datetime, date
from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from sqlalchemy import func, text
from sqlalchemy.orm import Session
from urllib.parse import quote

from pydantic import BaseModel, Field

from database import Base, SessionLocal, engine, get_db
from models import Book, Marginalia, Tag, marginalia_tag
from schemas import (
    BookCreate,
    BookOption,
    BookResponse,
    BookUpdate,
    ChannelStat,
    MarginaliaCreate,
    MarginaliaResponse,
    MarginaliaUpdate,
    PaginatedMarginaliaResponse,
    StatsSummaryResponse,
    TagCreate,
    TagResponse,
)
from seed import MARGINALIA_SEED_DATA, seed_books, seed_marginalia, seed_tags

app = FastAPI(title="旧书页眉批摘录库", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3101"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DbSession = Annotated[Session, Depends(get_db)]


def _ensure_marginalia_columns() -> None:
    """为已有的 marginalia 表自动补加 is_favorite 和 entry_date 列（列不存在时执行）。"""
    with engine.connect() as conn:
        cols = conn.execute(text("PRAGMA table_info(marginalia)")).fetchall()
        col_names = {c[1] for c in cols}

        if "is_favorite" not in col_names:
            conn.execute(text("ALTER TABLE marginalia ADD COLUMN is_favorite BOOLEAN NOT NULL DEFAULT 0"))
        if "entry_date" not in col_names:
            conn.execute(
                text("ALTER TABLE marginalia ADD COLUMN entry_date DATE NOT NULL DEFAULT :d")
            ).bindparams(d=date.today().isoformat())
        conn.commit()


def _patch_seed_data_for_existing_records(db: Session) -> None:
    """按书名+页码为已有5条示例摘录补填种子配置中的录入日期和收藏状态。"""
    for seed_item in MARGINALIA_SEED_DATA:
        book_title = seed_item["book_title"]
        page_number = seed_item["page_number"]
        entry_date = seed_item["entry_date"]
        is_favorite = seed_item.get("is_favorite", False)

        record = (
            db.query(Marginalia)
            .filter(
                Marginalia.book_title == book_title,
                Marginalia.page_number == page_number,
            )
            .first()
        )
        if record is not None:
            updated = False
            if record.entry_date != entry_date:
                record.entry_date = entry_date
                updated = True
            if record.is_favorite != is_favorite:
                record.is_favorite = is_favorite
                updated = True
            if updated:
                db.commit()


@app.on_event("startup")
def on_startup() -> None:
    """启动时建表、补列并写入 seed 数据。"""
    Base.metadata.create_all(bind=engine)
    _ensure_marginalia_columns()
    db = SessionLocal()
    try:
        seed_tags(db)
        seed_books(db)
        seed_marginalia(db)
        _patch_seed_data_for_existing_records(db)
    finally:
        db.close()


def _book_to_response(book: Book, db: Session) -> BookResponse:
    """将 Book ORM 对象转为响应模型，按外键统计摘录条数。"""
    count = (
        db.query(func.count(Marginalia.id))
        .filter(Marginalia.book_id == book.id)
        .scalar()
        or 0
    )
    return BookResponse(
        id=book.id,
        title=book.title,
        author=book.author,
        edition=book.edition,
        volume_count=book.volume_count,
        marginalia_count=count,
    )


@app.get("/api/books", response_model=list[BookResponse])
def list_books(
    db: DbSession,
    keyword: str | None = Query(None, description="按书名或作者模糊搜索"),
) -> list[BookResponse]:
    """获取书目列表，支持按书名/作者搜索，返回关联摘录条数。"""
    query = db.query(Book)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter((Book.title.ilike(like)) | (Book.author.ilike(like)))
    books = query.order_by(Book.id.desc()).all()
    return [_book_to_response(b, db) for b in books]


@app.get("/api/books/options", response_model=list[BookOption])
def list_book_options(db: DbSession) -> list[Book]:
    """获取所有书目下拉选项（id + 书名 + 作者）。"""
    return db.query(Book).order_by(Book.title.asc()).all()


@app.get("/api/books/{item_id}", response_model=BookResponse)
def get_book(item_id: int, db: DbSession) -> BookResponse:
    """获取单条书目。"""
    item = db.get(Book, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="书目不存在")
    return _book_to_response(item, db)


@app.post("/api/books", response_model=BookResponse, status_code=201)
def create_book(payload: BookCreate, db: DbSession) -> BookResponse:
    """新增书目。"""
    item = Book(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return _book_to_response(item, db)


@app.put("/api/books/{item_id}", response_model=BookResponse)
def update_book(
    item_id: int,
    payload: BookUpdate,
    db: DbSession,
) -> BookResponse:
    """更新书目；若书名变更，则同步更新所有关联摘录的书名字段。"""
    item = db.get(Book, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="书目不存在")

    old_title = item.title

    for key, value in payload.model_dump().items():
        setattr(item, key, value)

    if payload.title != old_title:
        db.query(Marginalia).filter(Marginalia.book_id == item.id).update(
            {Marginalia.book_title: payload.title}, synchronize_session=False
        )

    db.commit()
    db.refresh(item)
    return _book_to_response(item, db)


@app.delete("/api/books/{item_id}", status_code=204)
def delete_book(item_id: int, db: DbSession) -> None:
    """删除书目；若仍有关联摘录则拒绝删除。"""
    item = db.get(Book, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="书目不存在")

    marginalia_count = (
        db.query(func.count(Marginalia.id))
        .filter(Marginalia.book_id == item_id)
        .scalar()
        or 0
    )
    if marginalia_count > 0:
        raise HTTPException(
            status_code=400,
            detail=f"该书目下仍有 {marginalia_count} 条摘录，无法删除",
        )

    db.delete(item)
    db.commit()


@app.get("/api/stats/summary", response_model=StatsSummaryResponse)
def stats_summary(db: DbSession) -> StatsSummaryResponse:
    total_marginalia = db.query(func.count(Marginalia.id)).scalar() or 0
    distinct_book_count = (
        db.query(func.count(func.distinct(Marginalia.book_id))).scalar() or 0
    )
    channel_rows = (
        db.query(
            Marginalia.purchase_channel,
            func.count(Marginalia.id),
        )
        .group_by(Marginalia.purchase_channel)
        .all()
    )
    channel_distribution: list[ChannelStat] = []
    for channel, count in channel_rows:
        ch_name = channel if channel else "未知"
        pct = round(count / total_marginalia * 100, 1) if total_marginalia > 0 else 0
        channel_distribution.append(ChannelStat(channel=ch_name, count=count, percentage=pct))
    channel_distribution.sort(key=lambda x: x.count, reverse=True)
    return StatsSummaryResponse(
        total_marginalia=total_marginalia,
        distinct_book_count=distinct_book_count,
        channel_distribution=channel_distribution,
    )


def _marginalia_to_response(item: Marginalia) -> MarginaliaResponse:
    return MarginaliaResponse(
        id=item.id,
        book_id=item.book_id,
        book_title=item.book_title,
        page_number=item.page_number,
        original_text=item.original_text,
        marginalia_content=item.marginalia_content,
        purchase_channel=item.purchase_channel,
        is_favorite=item.is_favorite,
        entry_date=item.entry_date,
        tags=[TagResponse(id=t.id, name=t.name) for t in item.tags],
    )


@app.get("/api/marginalia", response_model=PaginatedMarginaliaResponse)
def list_marginalia(
    db: DbSession,
    book_title: str | None = Query(None, description="按书名模糊搜索"),
    content_keyword: str | None = Query(None, description="按眉批内容模糊搜索"),
    is_favorite: bool | None = Query(None, description="仅看收藏"),
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
) -> PaginatedMarginaliaResponse:
    query = db.query(Marginalia)
    if book_title:
        like = f"%{book_title}%"
        query = query.filter(Marginalia.book_title.ilike(like))
    if content_keyword:
        like = f"%{content_keyword}%"
        query = query.filter(Marginalia.marginalia_content.ilike(like))
    if is_favorite is not None:
        query = query.filter(Marginalia.is_favorite == is_favorite)
    total = query.count()
    items = query.order_by(Marginalia.id.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedMarginaliaResponse(
        items=[_marginalia_to_response(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@app.get("/api/marginalia/export")
def export_marginalia(db: DbSession) -> StreamingResponse:
    """导出全部摘录记录为 CSV 文件。"""
    items = db.query(Marginalia).order_by(Marginalia.id.desc()).all()

    buffer = io.StringIO()
    buffer.write("\ufeff")
    writer = csv.writer(buffer)
    writer.writerow(["书名", "页码", "原文", "眉批内容", "购入渠道", "是否收藏", "录入日期"])

    for item in items:
        writer.writerow([
            item.book_title,
            item.page_number,
            item.original_text,
            item.marginalia_content,
            item.purchase_channel or "",
            "是" if item.is_favorite else "否",
            item.entry_date.isoformat() if hasattr(item.entry_date, "isoformat") else str(item.entry_date),
        ])

    buffer.seek(0)
    filename = f"摘录导出_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
    encoded_filename = quote(filename)

    return StreamingResponse(
        iter([buffer.getvalue()]),
        media_type="text/csv; charset=utf-8-sig",
        headers={
            "Content-Disposition": f"attachment; filename*=UTF-8''{encoded_filename}",
        },
    )


@app.get("/api/marginalia/{item_id}", response_model=MarginaliaResponse)
def get_marginalia(item_id: int, db: DbSession) -> MarginaliaResponse:
    """获取单条摘录。"""
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    return _marginalia_to_response(item)


@app.post("/api/marginalia", response_model=MarginaliaResponse, status_code=201)
def create_marginalia(payload: MarginaliaCreate, db: DbSession) -> MarginaliaResponse:
    book = db.get(Book, payload.book_id)
    if book is None:
        raise HTTPException(status_code=400, detail="指定的书目不存在")

    tag_ids = payload.tag_ids or []
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all() if tag_ids else []

    item = Marginalia(
        book_id=payload.book_id,
        book_title=book.title,
        page_number=payload.page_number,
        original_text=payload.original_text,
        marginalia_content=payload.marginalia_content,
        purchase_channel=payload.purchase_channel,
        is_favorite=payload.is_favorite,
        entry_date=payload.entry_date,
        tags=tags,
    )
    db.add(item)
    db.commit()
    db.refresh(item)
    return _marginalia_to_response(item)


@app.put("/api/marginalia/{item_id}", response_model=MarginaliaResponse)
def update_marginalia(
    item_id: int,
    payload: MarginaliaUpdate,
    db: DbSession,
) -> MarginaliaResponse:
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")

    book = db.get(Book, payload.book_id)
    if book is None:
        raise HTTPException(status_code=400, detail="指定的书目不存在")

    item.book_id = payload.book_id
    item.book_title = book.title
    item.page_number = payload.page_number
    item.original_text = payload.original_text
    item.marginalia_content = payload.marginalia_content
    item.purchase_channel = payload.purchase_channel
    item.is_favorite = payload.is_favorite
    item.entry_date = payload.entry_date

    tag_ids = payload.tag_ids if payload.tag_ids is not None else []
    tags = db.query(Tag).filter(Tag.id.in_(tag_ids)).all() if tag_ids else []
    item.tags = tags

    db.commit()
    db.refresh(item)
    return _marginalia_to_response(item)


@app.delete("/api/marginalia/{item_id}", status_code=204)
def delete_marginalia(item_id: int, db: DbSession) -> None:
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")

    db.delete(item)
    db.commit()


class ToggleFavoritePayload(BaseModel):
    is_favorite: bool = Field(..., description="目标收藏状态")


@app.patch("/api/marginalia/{item_id}/favorite", response_model=MarginaliaResponse)
def toggle_favorite(
    item_id: int,
    payload: ToggleFavoritePayload,
    db: DbSession,
) -> MarginaliaResponse:
    """行内切换收藏状态。"""
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    item.is_favorite = payload.is_favorite
    db.commit()
    db.refresh(item)
    return _marginalia_to_response(item)


@app.get("/api/tags", response_model=list[TagResponse])
def list_tags(db: DbSession) -> list[TagResponse]:
    items = db.query(Tag).order_by(Tag.id.asc()).all()
    return items


@app.post("/api/tags", response_model=TagResponse, status_code=201)
def create_tag(payload: TagCreate, db: DbSession) -> TagResponse:
    existing = db.query(Tag).filter(Tag.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="标签名称已存在")
    item = Tag(name=payload.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/tags/{item_id}", status_code=204)
def delete_tag(item_id: int, db: DbSession) -> None:
    item = db.get(Tag, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    db.execute(marginalia_tag.delete().where(marginalia_tag.c.tag_id == item_id))
    db.delete(item)
    db.commit()


@app.post("/api/marginalia/{item_id}/tags/{tag_id}", status_code=204)
def bind_tag(item_id: int, tag_id: int, db: DbSession) -> None:
    marginalia_item = db.get(Marginalia, item_id)
    if marginalia_item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    if tag not in marginalia_item.tags:
        marginalia_item.tags.append(tag)
        db.commit()


@app.delete("/api/marginalia/{item_id}/tags/{tag_id}", status_code=204)
def unbind_tag(item_id: int, tag_id: int, db: DbSession) -> None:
    marginalia_item = db.get(Marginalia, item_id)
    if marginalia_item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    if tag in marginalia_item.tags:
        marginalia_item.tags.remove(tag)
        db.commit()
