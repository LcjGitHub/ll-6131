"""眉批摘录 ORM 模型。"""

from sqlalchemy import Integer, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from database import Base


class Marginalia(Base):
    """旧书页眉批摘录表。"""

    __tablename__ = "marginalia"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    book_title: Mapped[str] = mapped_column(String(255), nullable=False, index=True)
    page_number: Mapped[str] = mapped_column(String(50), nullable=False)
    original_text: Mapped[str] = mapped_column(Text, nullable=False)
    marginalia_content: Mapped[str] = mapped_column(Text, nullable=False)
    purchase_channel: Mapped[str | None] = mapped_column(String(255), nullable=True)
