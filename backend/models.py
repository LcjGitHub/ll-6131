"""眉批摘录 ORM 模型。"""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column, relationship

from database import Base


class Book(Base):
    """藏书书目表。"""

    __tablename__ = "books"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    author: Mapped[str] = mapped_column(String(255), nullable=False)
    edition: Mapped[str | None] = mapped_column(String(255), nullable=True)
    volume_count: Mapped[int] = mapped_column(Integer, nullable=False, default=1)

    marginalia: Mapped[list["Marginalia"]] = relationship(
        primaryjoin="foreign(Marginalia.book_title) == Book.title",
        viewonly=True,
    )


class Marginalia(Base):
    """旧书页眉批摘录表。"""

    __tablename__ = "marginalia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    book_title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    page_number: Mapped[str] = mapped_column(String(50), nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    marginalia_content: Mapped[str] = mapped_column(Text, nullable=False)
    purchase_channel: Mapped[str | None] = mapped_column(String(255), nullable=True)
