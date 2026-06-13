"""旧书页眉批摘录库 API。"""

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import Book, Marginalia
from schemas import (
    BookCreate,
    BookResponse,
    BookUpdate,
    MarginaliaCreate,
    MarginaliaResponse,
    MarginaliaUpdate,
)
from seed import seed_books, seed_marginalia

app = FastAPI(title="旧书页眉批摘录库", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3101"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DbSession = Annotated[Session, Depends(get_db)]


@app.on_event("startup")
def on_startup() -> None:
    """启动时建表并写入 seed 数据。"""
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        seed_books(db)
        seed_marginalia(db)
    finally:
        db.close()


def _book_to_response(book: Book, db: Session) -> BookResponse:
    """将 Book ORM 对象转为响应模型，附加摘录条数。"""
    count = (
        db.query(func.count(Marginalia.id))
        .filter(Marginalia.book_title == book.title)
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
    """更新书目。"""
    item = db.get(Book, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="书目不存在")

    for key, value in payload.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return _book_to_response(item, db)


@app.delete("/api/books/{item_id}", status_code=204)
def delete_book(item_id: int, db: DbSession) -> None:
    """删除书目。"""
    item = db.get(Book, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="书目不存在")

    db.delete(item)
    db.commit()


@app.get("/api/marginalia", response_model=list[MarginaliaResponse])
def list_marginalia(
    db: DbSession,
    book_title: str | None = Query(None, description="按书名模糊搜索"),
) -> list[Marginalia]:
    """获取摘录列表，支持书名搜索。"""
    query = db.query(Marginalia)
    if book_title:
        query = query.filter(Marginalia.book_title.contains(book_title))
    return query.order_by(Marginalia.id.desc()).all()


@app.get("/api/marginalia/{item_id}", response_model=MarginaliaResponse)
def get_marginalia(item_id: int, db: DbSession) -> Marginalia:
    """获取单条摘录。"""
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    return item


@app.post("/api/marginalia", response_model=MarginaliaResponse, status_code=201)
def create_marginalia(payload: MarginaliaCreate, db: DbSession) -> Marginalia:
    """新增摘录。"""
    item = Marginalia(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@app.put("/api/marginalia/{item_id}", response_model=MarginaliaResponse)
def update_marginalia(
    item_id: int,
    payload: MarginaliaUpdate,
    db: DbSession,
) -> Marginalia:
    """更新摘录。"""
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")

    for key, value in payload.model_dump().items():
        setattr(item, key, value)

    db.commit()
    db.refresh(item)
    return item


@app.delete("/api/marginalia/{item_id}", status_code=204)
def delete_marginalia(item_id: int, db: DbSession) -> None:
    """删除摘录。"""
    item = db.get(Marginalia, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")

    db.delete(item)
    db.commit()
