"""操作日志相关路由。"""

from typing import Annotated

from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session

from database import get_db
from models import OperationLog
from schemas import OperationLogResponse, PaginatedOperationLogResponse

router = APIRouter(prefix="/api/logs", tags=["logs"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("", response_model=PaginatedOperationLogResponse)
def list_operation_logs(
    db: DbSession,
    operation_type: str | None = Query(None, description="按操作类型筛选：create/update/delete"),
    target_type: str | None = Query(None, description="按目标类型筛选：book/marginalia"),
    page: int = Query(1, ge=1, description="页码，从1开始"),
    page_size: int = Query(10, ge=1, le=100, description="每页条数"),
) -> PaginatedOperationLogResponse:
    query = db.query(OperationLog)
    if operation_type:
        query = query.filter(OperationLog.operation_type == operation_type)
    if target_type:
        query = query.filter(OperationLog.target_type == target_type)
    total = query.count()

    query = query.order_by(OperationLog.created_at.desc())
    items = query.offset((page - 1) * page_size).limit(page_size).all()

    return PaginatedOperationLogResponse(
        items=[OperationLogResponse.model_validate(item) for item in items],
        total=total,
        page=page,
        page_size=page_size,
    )
