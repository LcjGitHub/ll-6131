"""公共工具函数与共享模型。"""

from pydantic import BaseModel, Field
from sqlalchemy import func
from sqlalchemy.orm import Session
from fastapi import HTTPException

from models import Book, Marginalia, Tag, marginalia_tag
from schemas import BookResponse, MarginaliaResponse, TagResponse


class ToggleFavoritePayload(BaseModel):
    is_favorite: bool = Field(..., description="目标收藏状态")


def book_to_response(book: Book, db: Session) -> BookResponse:
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


def marginalia_to_response(item: Marginalia) -> MarginaliaResponse:
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


def resolve_tags_by_ids(db: Session, tag_ids: list[int]) -> list[Tag]:
    return db.query(Tag).filter(Tag.id.in_(tag_ids)).all() if tag_ids else []


def bind_tag_to_marginalia(db: Session, item_id: int, tag_id: int) -> None:
    marginalia_item = db.get(Marginalia, item_id)
    if marginalia_item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    if tag not in marginalia_item.tags:
        marginalia_item.tags.append(tag)
        db.commit()


def unbind_tag_from_marginalia(db: Session, item_id: int, tag_id: int) -> None:
    marginalia_item = db.get(Marginalia, item_id)
    if marginalia_item is None:
        raise HTTPException(status_code=404, detail="摘录不存在")
    tag = db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    if tag in marginalia_item.tags:
        marginalia_item.tags.remove(tag)
        db.commit()


def delete_tag_with_associations(db: Session, tag_id: int) -> None:
    item = db.get(Tag, tag_id)
    if item is None:
        raise HTTPException(status_code=404, detail="标签不存在")
    db.execute(marginalia_tag.delete().where(marginalia_tag.c.tag_id == tag_id))
    db.delete(item)
    db.commit()
