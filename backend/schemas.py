"""Pydantic 请求/响应模型。"""

from pydantic import BaseModel, ConfigDict, Field
from datetime import date, datetime


class TagCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100, description="标签名称")


class TagResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    name: str


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


class BookOption(BaseModel):
    """书目下拉选项。"""

    model_config = ConfigDict(from_attributes=True)

    id: int
    title: str
    author: str


class MarginaliaBase(BaseModel):
    """眉批摘录公共字段。"""

    page_number: str = Field(..., min_length=1, max_length=50, description="页码")
    original_text: str = Field(..., min_length=1, description="原文")
    marginalia_content: str = Field(..., min_length=1, description="眉批内容")
    purchase_channel: str | None = Field(None, max_length=255, description="购入渠道")
    is_favorite: bool = Field(False, description="是否收藏")
    entry_date: date = Field(..., description="录入日期")


class MarginaliaCreate(MarginaliaBase):
    book_id: int = Field(..., gt=0, description="所属书目 ID")
    tag_ids: list[int] = Field(default_factory=list, description="标签 ID 列表")


class MarginaliaUpdate(MarginaliaBase):
    book_id: int = Field(..., gt=0, description="所属书目 ID")
    tag_ids: list[int] = Field(default_factory=list, description="标签 ID 列表")


class ChannelStat(BaseModel):
    channel: str = Field(..., description="购入渠道名称")
    count: int = Field(..., description="该渠道摘录条数")
    percentage: float = Field(..., description="该渠道占比（0-100）")


class StatsSummaryResponse(BaseModel):
    total_marginalia: int = Field(..., description="摘录总条数")
    distinct_book_count: int = Field(..., description="不同书名数量")
    channel_distribution: list[ChannelStat] = Field(
        default_factory=list, description="各购入渠道分布"
    )


class MarginaliaResponse(MarginaliaBase):

    model_config = ConfigDict(from_attributes=True)

    id: int
    book_id: int
    book_title: str
    tags: list[TagResponse] = Field(default_factory=list, description="关联标签")
    is_deleted: bool = Field(False, description="是否已删除")
    deleted_at: datetime | None = Field(None, description="删除时间")


class PaginatedMarginaliaResponse(BaseModel):
    items: list[MarginaliaResponse] = Field(..., description="当前页数据")
    total: int = Field(..., description="总条数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页条数")


class BatchDeleteRequest(BaseModel):
    ids: list[int] = Field(..., description="要删除的摘录 ID 列表")


class BatchDeleteResponse(BaseModel):
    deleted_count: int = Field(..., description="成功删除的条数")


class OperationLogResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    id: int
    operation_type: str = Field(..., description="操作类型：create/update/delete")
    target_type: str = Field(..., description="目标类型：book/marginalia")
    target_id: int = Field(..., description="目标编号")
    summary: str = Field(..., description="操作简要内容")
    created_at: datetime = Field(..., description="操作时间")


class PaginatedOperationLogResponse(BaseModel):
    items: list[OperationLogResponse] = Field(..., description="当前页数据")
    total: int = Field(..., description="总条数")
    page: int = Field(..., description="当前页码")
    page_size: int = Field(..., description="每页条数")


class CompareResponse(BaseModel):
    left: MarginaliaResponse = Field(..., description="左侧摘录")
    right: MarginaliaResponse = Field(..., description="右侧摘录")


class ImportErrorDetail(BaseModel):
    row: int = Field(..., description="行号")
    error: str = Field(..., description="错误原因")


class ImportResponse(BaseModel):
    success_count: int = Field(..., description="成功导入条数")
    duplicate_count: int = Field(..., description="重复跳过条数")
    error_count: int = Field(..., description="失败条数")
    errors: list[ImportErrorDetail] = Field(default_factory=list, description="错误详情")
