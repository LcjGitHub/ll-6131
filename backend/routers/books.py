"""书目相关路由。"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Book, Marginalia
from schemas import BookCreate, BookOption, BookResponse, BookUpdate
from utils import book_to_response, create_operation_log

router = APIRouter(prefix="/api/books", tags=["books"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=list[BookResponse])
def list_books(
    db: DbSession,
    keyword: str | None = Query(None, description="按书名或作者模糊搜索"),
) -> list[BookResponse]:
    query = db.query(Book)
    if keyword:
        like = f"%{keyword}%"
        query = query.filter((Book.title.ilike(like)) | (Book.author.ilike(like)))
    books = query.order_by(Book.id.desc()).all()
    return [book_to_response(b, db) for b in books]


@router.get("/options", response_model=list[BookOption])
def list_book_options(db: DbSession) -> list[Book]:
    return db.query(Book).order_by(Book.title.asc()).all()


@router.get("/{item_id}", response_model=BookResponse)
def get_book(item_id: int, db: DbSession) -> BookResponse:
    item = db.get(Book, item_id)
    if item is None:
        raise HTTPException(status_code=404, detail="书目不存在")
    return book_to_response(item, db)


@router.post("", response_model=BookResponse, status_code=201)
def create_book(payload: BookCreate, db: DbSession) -> BookResponse:
    item = Book(**payload.model_dump())
    db.add(item)
    db.commit()
    db.refresh(item)
    create_operation_log(
        db,
        operation_type="create",
        target_type="book",
        target_id=item.id,
        summary=f"新增书目：{item.title}（{item.author}）",
    )
    return book_to_response(item, db)


@router.put("/{item_id}", response_model=BookResponse)
def update_book(
    item_id: int,
    payload: BookUpdate,
    db: DbSession,
) -> BookResponse:
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
    create_operation_log(
        db,
        operation_type="update",
        target_type="book",
        target_id=item.id,
        summary=f"更新书目：{item.title}（{item.author}）",
    )
    return book_to_response(item, db)


@router.delete("/{item_id}", status_code=204)
def delete_book(item_id: int, db: DbSession) -> None:
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

    book_title = item.title
    book_author = item.author
    create_operation_log(
        db,
        operation_type="delete",
        target_type="book",
        target_id=item_id,
        summary=f"删除书目：{book_title}（{book_author}）",
    )
    db.delete(item)
    db.commit()
