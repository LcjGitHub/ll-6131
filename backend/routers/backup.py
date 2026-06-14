"""数据备份与恢复路由。"""

import json
from datetime import datetime
from typing import Annotated

from fastapi import APIRouter, Depends, File, HTTPException, UploadFile
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session

from database import get_db
from models import Book, Marginalia, Tag, marginalia_tag


router = APIRouter(prefix="/api/backup", tags=["backup"])

DbSession = Annotated[Session, Depends(get_db)]


class BackupData:
    """备份数据结构。"""

    def __init__(self) -> None:
        self.version = "1.0"
        self.exported_at = datetime.now().isoformat()
        self.tags: list[dict] = []
        self.books: list[dict] = []
        self.marginalia: list[dict] = []
        self.marginalia_tags: list[dict] = []


def _serialize_tag(tag: Tag) -> dict:
    return {
        "id": tag.id,
        "name": tag.name,
    }


def _serialize_book(book: Book) -> dict:
    return {
        "id": book.id,
        "title": book.title,
        "author": book.author,
        "edition": book.edition,
        "volume_count": book.volume_count,
    }


def _serialize_marginalia(m: Marginalia) -> dict:
    return {
        "id": m.id,
        "book_id": m.book_id,
        "book_title": m.book_title,
        "page_number": m.page_number,
        "original_text": m.original_text,
        "marginalia_content": m.marginalia_content,
        "purchase_channel": m.purchase_channel,
        "is_favorite": m.is_favorite,
        "entry_date": m.entry_date.isoformat() if m.entry_date else None,
        "is_deleted": m.is_deleted,
        "deleted_at": m.deleted_at.isoformat() if m.deleted_at else None,
    }


@router.get("/export")
def export_backup(db: DbSession) -> StreamingResponse:
    """导出当前数据库中摘录、书目、标签三张核心表的数据为备份文件。"""
    backup = BackupData()

    tags = db.query(Tag).order_by(Tag.id).all()
    backup.tags = [_serialize_tag(tag) for tag in tags]

    books = db.query(Book).order_by(Book.id).all()
    backup.books = [_serialize_book(book) for book in books]

    marginalia_list = db.query(Marginalia).order_by(Marginalia.id).all()
    backup.marginalia = [_serialize_marginalia(m) for m in marginalia_list]

    mt_rows = db.execute(marginalia_tag.select()).fetchall()
    backup.marginalia_tags = [
        {"marginalia_id": row[0], "tag_id": row[1]} for row in mt_rows
    ]

    backup_json = json.dumps(backup.__dict__, ensure_ascii=False, indent=2)
    filename = f"marginalia-backup-{datetime.now().strftime('%Y%m%d-%H%M%S')}.json"

    def iter_data():
        yield backup_json

    return StreamingResponse(
        iter_data(),
        media_type="application/json",
        headers={
            "Content-Disposition": f"attachment; filename={filename}",
        },
    )


class RestoreResult:
    """恢复结果。"""

    def __init__(self) -> None:
        self.tags_created = 0
        self.tags_updated = 0
        self.books_created = 0
        self.books_updated = 0
        self.marginalia_created = 0
        self.marginalia_updated = 0
        self.relations_restored = 0


@router.post("/restore", response_model=dict)
def restore_backup(db: DbSession, file: UploadFile = File(...)) -> dict:
    """读取备份文件并合并写入数据库。"""
    if not file.filename or not file.filename.endswith(".json"):
        raise HTTPException(status_code=400, detail="请上传有效的 JSON 备份文件")

    try:
        content = file.file.read()
        data = json.loads(content)
    except (json.JSONDecodeError, UnicodeDecodeError):
        raise HTTPException(status_code=400, detail="备份文件格式错误，无法解析")

    required_keys = {"version", "tags", "books", "marginalia", "marginalia_tags"}
    if not required_keys.issubset(data.keys()):
        raise HTTPException(status_code=400, detail="备份文件缺少必要字段，格式不正确")

    result = RestoreResult()

    for tag_data in data.get("tags", []):
        tag_id = tag_data.get("id")
        tag_name = tag_data.get("name")
        if not tag_id or not tag_name:
            continue

        existing_tag = db.query(Tag).filter(Tag.id == tag_id).first()
        if existing_tag:
            existing_tag.name = tag_name
            result.tags_updated += 1
        else:
            new_tag = Tag(id=tag_id, name=tag_name)
            db.add(new_tag)
            result.tags_created += 1

    for book_data in data.get("books", []):
        book_id = book_data.get("id")
        if not book_id:
            continue

        existing_book = db.query(Book).filter(Book.id == book_id).first()
        if existing_book:
            existing_book.title = book_data.get("title", existing_book.title)
            existing_book.author = book_data.get("author", existing_book.author)
            existing_book.edition = book_data.get("edition", existing_book.edition)
            existing_book.volume_count = book_data.get("volume_count", existing_book.volume_count)
            result.books_updated += 1
        else:
            new_book = Book(
                id=book_id,
                title=book_data.get("title", ""),
                author=book_data.get("author", ""),
                edition=book_data.get("edition"),
                volume_count=book_data.get("volume_count", 1),
            )
            db.add(new_book)
            result.books_created += 1

    for m_data in data.get("marginalia", []):
        m_id = m_data.get("id")
        if not m_id:
            continue

        existing_m = db.query(Marginalia).filter(Marginalia.id == m_id).first()
        entry_date = None
        if m_data.get("entry_date"):
            try:
                entry_date = datetime.fromisoformat(m_data["entry_date"]).date()
            except (ValueError, TypeError):
                entry_date = datetime.now().date()

        deleted_at = None
        if m_data.get("deleted_at"):
            try:
                deleted_at = datetime.fromisoformat(m_data["deleted_at"])
            except (ValueError, TypeError):
                deleted_at = None

        if existing_m:
            existing_m.book_id = m_data.get("book_id", existing_m.book_id)
            existing_m.book_title = m_data.get("book_title", existing_m.book_title)
            existing_m.page_number = m_data.get("page_number", existing_m.page_number)
            existing_m.original_text = m_data.get("original_text", existing_m.original_text)
            existing_m.marginalia_content = m_data.get(
                "marginalia_content", existing_m.marginalia_content
            )
            existing_m.purchase_channel = m_data.get("purchase_channel", existing_m.purchase_channel)
            existing_m.is_favorite = m_data.get("is_favorite", existing_m.is_favorite)
            if entry_date:
                existing_m.entry_date = entry_date
            existing_m.is_deleted = m_data.get("is_deleted", existing_m.is_deleted)
            existing_m.deleted_at = deleted_at
            result.marginalia_updated += 1
        else:
            new_m = Marginalia(
                id=m_id,
                book_id=m_data.get("book_id", 0),
                book_title=m_data.get("book_title", ""),
                page_number=m_data.get("page_number", ""),
                original_text=m_data.get("original_text", ""),
                marginalia_content=m_data.get("marginalia_content", ""),
                purchase_channel=m_data.get("purchase_channel"),
                is_favorite=m_data.get("is_favorite", False),
                entry_date=entry_date or datetime.now().date(),
                is_deleted=m_data.get("is_deleted", False),
                deleted_at=deleted_at,
            )
            db.add(new_m)
            result.marginalia_created += 1

    db.execute(marginalia_tag.delete())
    for rel in data.get("marginalia_tags", []):
        m_id = rel.get("marginalia_id")
        t_id = rel.get("tag_id")
        if m_id and t_id:
            db.execute(
                marginalia_tag.insert().values(marginalia_id=m_id, tag_id=t_id)
            )
            result.relations_restored += 1

    db.commit()

    return {
        "success": True,
        "summary": {
            "tags_created": result.tags_created,
            "tags_updated": result.tags_updated,
            "books_created": result.books_created,
            "books_updated": result.books_updated,
            "marginalia_created": result.marginalia_created,
            "marginalia_updated": result.marginalia_updated,
            "relations_restored": result.relations_restored,
        },
    }
