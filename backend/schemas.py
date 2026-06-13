"""Pydantic 请求/响应模型。"""

from pydantic import BaseModel, ConfigDict, Field


class BookBase(BaseModel):
    """书目公共字段。"""

    title: str = Field(..., min_length=1, max_length=255, description="书名")
    author: str = Field(..., min_length=1, max_length=255, description="作者")
    edition: str | None = Field(None, max_length=255, description="版本说明")
    volume_count: int = Field(1, ge=1, description="册数")


class BookCreate(BookBase):
    """创建书目。"""


class BookUpdate(BookBase):
    """更新书目。"""


class BookResponse(BookBase):
    """书目响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    marginalia_count: int = Field(0, description="关联摘录条数")


class MarginaliaBase(BaseModel):
    """眉批摘录公共字段。"""

    book_title: str = Field(..., min_length=1, max_length=255, description="书名")
    page_number: str = Field(..., min_length=1, max_length=50, description="页码")
    original_text: str = Field(..., min_length=1, description="原文")
    marginalia_content: str = Field(..., min_length=1, description="眉批内容")
    purchase_channel: str | None = Field(None, max_length=255, description="购入渠道")


class MarginaliaCreate(MarginaliaBase):
    """创建摘录。"""


class MarginaliaUpdate(MarginaliaBase):
    """更新摘录。"""


class MarginaliaResponse(MarginaliaBase):
    """摘录响应。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
