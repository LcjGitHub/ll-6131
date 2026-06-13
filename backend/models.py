"""眉批摘录 ORM 模型。"""

from sqlalchemy import Column, Integer, String, Table, Text, ForeignKey, UniqueConstraint, Boolean, Date
from sqlalchemy.orm import Mapped, mapped_column, relationship
from datetime import date

from database import Base

marginalia_tag = Table(
    "marginalia_tag",
    Base.metadata,
    Column("marginalia_id", Integer, ForeignKey("marginalia.id", ondelete="CASCADE"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id", ondelete="CASCADE"), primary_key=True),
)


class Tag(Base):
    """标签分类表。"""

    __tablename__ = "tags"
    __table_args__ = (UniqueConstraint("name"),)

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(100), nullable=False, unique=True, index=True)

    marginalia: Mapped[list["Marginalia"]] = relationship(
        secondary=marginalia_tag,
        back_populates="tags",
    )


class Book(Base):
    """藏书书目表。"""

    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    edition: Mapped[str | None] = mapped_column(String(255), nullable=True)
    volume_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    marginalia: Mapped[list["Marginalia"]] = relationship(
        back_populates="book",
    )


class Marginalia(Base):
    """旧书页眉批摘录表。"""

    __tablename__ = "marginalia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    book_id: Mapped[int] = mapped_column(
        Integer, ForeignKey("books.id"), nullable=False, index=True
    )
    book_title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    page_number: Mapped[str] = mapped_column(String(50), nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    marginalia_content: Mapped[str] = mapped_column(Text, nullable=False)
    purchase_channel: Mapped[str | None] = mapped_column(String(255), nullable=True)
    is_favorite: Mapped[bool] = mapped_column(Boolean, nullable=False, default=False)
    entry_date: Mapped[date] = mapped_column(Date, nullable=False, default=date.today)

    book: Mapped[Book] = relationship(back_populates="marginalia")
    tags: Mapped[list["Tag"]] = relationship(
        secondary=marginalia_tag,
        back_populates="marginalia",
    )
