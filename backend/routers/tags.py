"""标签相关路由（含摘录-标签绑定解绑）。"""

from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Tag
from schemas import TagCreate, TagResponse
from utils import (
    bind_tag_to_marginalia,
    delete_tag_with_associations,
    unbind_tag_from_marginalia,
)

router = APIRouter(tags=["tags"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/api/tags", response_model=list[TagResponse])
def list_tags(db: DbSession) -> list[TagResponse]:
    items = db.query(Tag).order_by(Tag.id.asc()).all()
    return items


@router.post("/api/tags", response_model=TagResponse, status_code=201)
def create_tag(payload: TagCreate, db: DbSession) -> TagResponse:
    existing = db.query(Tag).filter(Tag.name == payload.name).first()
    if existing:
        raise HTTPException(status_code=400, detail="标签名称已存在")
    item = Tag(name=payload.name)
    db.add(item)
    db.commit()
    db.refresh(item)
    return item


@router.delete("/api/tags/{item_id}", status_code=204)
def delete_tag(item_id: int, db: DbSession) -> None:
    delete_tag_with_associations(db, item_id)


@router.post("/api/marginalia/{item_id}/tags/{tag_id}", status_code=204)
def bind_tag(item_id: int, tag_id: int, db: DbSession) -> None:
    bind_tag_to_marginalia(db, item_id, tag_id)


@router.delete("/api/marginalia/{item_id}/tags/{tag_id}", status_code=204)
def unbind_tag(item_id: int, tag_id: int, db: DbSession) -> None:
    unbind_tag_from_marginalia(db, item_id, tag_id)
