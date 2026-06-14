"""统计相关路由。"""

from typing import Annotated

from fastapi import APIRouter, Depends
from sqlalchemy import func
from sqlalchemy.orm import Session

from database import get_db
from models import Marginalia
from schemas import ChannelStat, StatsSummaryResponse

router = APIRouter(prefix="/api/stats", tags=["stats"])

DbSession = Annotated[Session, Depends(get_db)]


@router.get("/summary", response_model=StatsSummaryResponse)
def stats_summary(db: DbSession) -> StatsSummaryResponse:
    total_marginalia = db.query(func.count(Marginalia.id)).filter(Marginalia.is_deleted == False).scalar() or 0
    distinct_book_count = (
        db.query(func.count(func.distinct(Marginalia.book_id))).filter(Marginalia.is_deleted == False).scalar() or 0
    )
    channel_rows = (
        db.query(
            Marginalia.purchase_channel,
            func.count(Marginalia.id),
        )
        .filter(Marginalia.is_deleted == False)
        .group_by(Marginalia.purchase_channel)
        .all()
    )
    channel_distribution: list[ChannelStat] = []
    for channel, count in channel_rows:
        ch_name = channel if channel else "未知"
        pct = round(count / total_marginalia * 100, 1) if total_marginalia > 0 else 0
        channel_distribution.append(ChannelStat(channel=ch_name, count=count, percentage=pct))
    channel_distribution.sort(key=lambda x: x.count, reverse=True)
    return StatsSummaryResponse(
        total_marginalia=total_marginalia,
        distinct_book_count=distinct_book_count,
        channel_distribution=channel_distribution,
    )
