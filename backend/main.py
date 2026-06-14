"""旧书页眉批摘录库 API。"""

from datetime import date

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text
from sqlalchemy.orm import Session

from database import Base, SessionLocal, engine
from models import Marginalia
from routers import books, marginalia, stats, tags
from seed import MARGINALIA_SEED_DATA, seed_books, seed_marginalia, seed_tags

app = FastAPI(title="旧书页眉批摘录库", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3101"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _ensure_marginalia_columns() -> None:
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


app.include_router(books.router)
app.include_router(marginalia.router)
app.include_router(tags.router)
app.include_router(stats.router)
