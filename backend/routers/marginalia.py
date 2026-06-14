"""摘录相关路由。"""

import csv
import io
from datetime import datetime
from typing import Annotated
from urllib.parse import quote

from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy import func, cast, Integer
from sqlalchemy.orm import Session

from database import get_db
from models import Book, Marginalia
from schemas import (
    BatchDeleteRequest,
    BatchDeleteResponse,
    MarginaliaCreate,
    MarginaliaResponse,
    MarginaliaUpdate,
    PaginatedMarginaliaResponse,
)
from utils import (
    ToggleFavoritePayload,
    create_operation_log,
    marginalia_to_response,
    resolve_tags_by_ids,
)

router = APIRouter(prefix="/api/marginalia", tags=["marginalia"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=PaginatedMarginaliaResponse)
def list_marginalia(
    db: DbSession,
    book_title: str | None = Query(None, description="按书名模糊搜索"),
    content_keyword: str | None = Query(None, description="按眉批内容模糊搜索"),
    is_favorite: bool | None = Query(None, description="仅看收藏"),
    sort_by: str | None = Query(None, description="排序方式：page_asc-页码升序，page_desc-页码降序，默认按编号倒序"),
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
) -> PaginatedMarginaliaResponse:
    query = db.query(Marginalia).filter(Marginalia.is_deleted == False)
    if book_title:
        like = f"%{book_title}%"
        query = query.filter(Marginalia.book_title.ilike(like))
    if content_keyword:
        like = f"%{content_keyword}%"
        query = query.filter(Marginalia.marginalia_content.ilike(like))
    if is_favorite is not None:
        query = query.filter(Marginalia.is_favorite == is_favorite)
    total = query.count()

    if sort_by == "page_asc":
        page_num_expr = cast(
            func.substr(Marginalia.page_number, func.instr(Marginalia.page_number, " ") + 1),
            Integer,
        )
        query = query.order_by(page_num_expr.asc(), Marginalia.id.desc())
    elif sort_by == "page_desc":
        page_num_expr = cast(
            func.substr(Marginalia.page_number, func.instr(Marginalia.page_number, " ") + 1),
            Integer,
        )
        query = query.order_by(page_num_expr.desc(), Marginalia.id.desc())
    else:
        query = query.order_by(Marginalia.id.desc())

    items = query.offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedMarginaliaResponse(
        items=[marginalia_to_response(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.get("/export")
def export_marginalia(db: DbSession) -> StreamingResponse:
    items = db.query(Marginalia).filter(Marginalia.is_deleted == False).order_by(Marginalia.id.desc()).all()

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


@router.get("/trash", response_model=PaginatedMarginaliaResponse)
def list_trash(
    db: DbSession,
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
) -> PaginatedMarginaliaResponse:
    query = db.query(Marginalia).filter(Marginalia.is_deleted == True)
    total = query.count()
    items = query.order_by(Marginalia.deleted_at.desc()).offset((page - 1) * page_size).limit(page_size).all()
    return PaginatedMarginaliaResponse(
        items=[marginalia_to_response(i) for i in items],
        total=total,
        page=page,
        page_size=page_size,
    )


@router.post("/{item_id}/restore", response_model=MarginaliaResponse)
def restore_marginalia(item_id: int, db: DbSession) -> MarginaliaResponse:
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    if not item.is_deleted:
        raise HTTPException(status_code=400, detail="该摘录未在回收站中")

    item.is_deleted = False
    item.deleted_at = None
    db.commit()
    db.refresh(item)
    create_operation_log(
        db,
        operation_type="restore",
        target_type="marginalia",
        target_id=item.id,
        summary=f"从回收站恢复：《{item.book_title}》第{item.page_number}页",
    )
    return marginalia_to_response(item)


@router.delete("/{item_id}/permanent", status_code=204)
def permanent_delete_marginalia(item_id: int, db: DbSession) -> None:
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    if not item.is_deleted:
        raise HTTPException(status_code=400, detail="该摘录未在回收站中，请先移入回收站")

    book_title = item.book_title
    page_number = item.page_number
    create_operation_log(
        db,
        operation_type="permanent_delete",
        target_type="marginalia",
        target_id=item_id,
        summary=f"彻底删除：《{book_title}》第{page_number}页",
    )
    db.delete(item)
    db.commit()


@router.get("/{item_id}", response_model=MarginaliaResponse)
def get_marginalia(item_id: int, db: DbSession) -> MarginaliaResponse:
    item = db.get(Marginalia, item_id)
    if item is None or item.is_deleted:
        raise HTTPException(status_code=404, detail="摘录不存在")
    return marginalia_to_response(item)


@router.post("", response_model=MarginaliaResponse, status_code=201)
def create_marginalia(payload: MarginaliaCreate, db: DbSession) -> MarginaliaResponse:
    book = db.get(Book, payload.book_id)
    if book is None:
        raise HTTPException(status_code=400, detail="指定的书目不存在")

    tag_ids = payload.tag_ids or []
    tags = resolve_tags_by_ids(db, tag_ids)

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
    create_operation_log(
        db,
        operation_type="create",
        target_type="marginalia",
        target_id=item.id,
        summary=f"新增摘录：《{item.book_title}》第{item.page_number}页",
    )
    return marginalia_to_response(item)


@router.put("/{item_id}", response_model=MarginaliaResponse)
def update_marginalia(
    item_id: int,
    payload: MarginaliaUpdate,
    db: DbSession,
) -> MarginaliaResponse:
    item = db.get(Marginalia, item_id)
    if item is None or item.is_deleted:
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
    tags = resolve_tags_by_ids(db, tag_ids)
    item.tags = tags

    db.commit()
    db.refresh(item)
    create_operation_log(
        db,
        operation_type="update",
        target_type="marginalia",
        target_id=item.id,
        summary=f"更新摘录：《{item.book_title}》第{item.page_number}页",
    )
    return marginalia_to_response(item)


@router.delete("/{item_id}", status_code=204)
def delete_marginalia(item_id: int, db: DbSession) -> None:
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    if item.is_deleted:
        raise HTTPException(status_code=404, detail="摘录不存在")

    book_title = item.book_title
    page_number = item.page_number
    item.is_deleted = True
    item.deleted_at = datetime.now()
    create_operation_log(
        db,
        operation_type="delete",
        target_type="marginalia",
        target_id=item_id,
        summary=f"移入回收站：《{book_title}》第{page_number}页",
    )
    db.commit()


@router.post("/batch-delete", response_model=BatchDeleteResponse)
def batch_delete_marginalia(payload: BatchDeleteRequest, db: DbSession) -> BatchDeleteResponse:
    ids = payload.ids
    if not ids:
        return BatchDeleteResponse(deleted_count=0)

    items = db.query(Marginalia).filter(Marginalia.id.in_(ids), Marginalia.is_deleted == False).all()
    deleted_count = len(items)

    for item in items:
        item.is_deleted = True
        item.deleted_at = datetime.now()
        create_operation_log(
            db,
            operation_type="delete",
            target_type="marginalia",
            target_id=item.id,
            summary=f"批量移入回收站：《{item.book_title}》第{item.page_number}页",
        )

    db.commit()
    return BatchDeleteResponse(deleted_count=deleted_count)


@router.patch("/{item_id}/favorite", response_model=MarginaliaResponse)
def toggle_favorite(
    item_id: int,
    payload: ToggleFavoritePayload,
    db: DbSession,
) -> MarginaliaResponse:
    item = db.get(Marginalia, item_id)
    if item is None or item.is_deleted:
        raise HTTPException(status_code=404, detail="摘录不存在")
    item.is_favorite = payload.is_favorite
    db.commit()
    db.refresh(item)
    return marginalia_to_response(item)
