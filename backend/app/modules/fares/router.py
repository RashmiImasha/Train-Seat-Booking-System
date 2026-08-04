import uuid

from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.deps import get_current_user
from app.db.session import get_db
from app.modules.fares import service
from app.schemas.fare import FarePreviewRead

router = APIRouter(prefix="/schedules/{schedule_id}/seats/{seat_id}/fare", tags=["fares"])


@router.get("", response_model=FarePreviewRead)
async def preview_fare(
    schedule_id: uuid.UUID,
    seat_id: uuid.UUID,
    origin: uuid.UUID = Query(..., description="origin station id"),
    destination: uuid.UUID = Query(..., description="destination station id"),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> FarePreviewRead:
    fare = await service.preview_fare(db, schedule_id, seat_id, origin, destination)
    return FarePreviewRead(fare=fare)