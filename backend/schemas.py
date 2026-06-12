"""Pydantic 请求/响应模型。"""

from pydantic import BaseModel, ConfigDict, Field


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
