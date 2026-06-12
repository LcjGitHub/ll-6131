"""旧书页眉批摘录库 API。"""

from typing import Annotated

from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine, get_db
from models import Marginalia
from schemas import MarginaliaCreate, MarginaliaResponse, MarginaliaUpdate
from seed import seed_marginalia

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
        seed_marginalia(db)
    finally:
        db.close()


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
