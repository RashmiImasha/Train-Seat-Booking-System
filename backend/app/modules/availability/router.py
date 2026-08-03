import uuid
 
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.session import get_db
from app.modules.availability import service
from app.schemas.seat import AvailableSeatRead
from app.schemas.seatmap import SeatMapEntryRead
from app.core.deps import get_current_user
 
router = APIRouter(prefix="/schedules/{schedule_id}/availability", tags=["availability"])
 
 
@router.get("", response_model=list[AvailableSeatRead])
async def get_available_seats(
    schedule_id: uuid.UUID,
    origin: uuid.UUID = Query(..., description="origin station id"),
    destination: uuid.UUID = Query(..., description="destination station id"),
    db: AsyncSession = Depends(get_db),
) -> list[AvailableSeatRead]:
    return await service.get_available_seats(db, schedule_id, origin, destination)

seat_map_router = APIRouter(prefix="/schedules/{schedule_id}/seat-map", tags=["availability"])

@seat_map_router.get("", response_model=list[SeatMapEntryRead])
async def get_seat_map(
    schedule_id: uuid.UUID,
    coach_id: uuid.UUID | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
    _current_user=Depends(get_current_user),
) -> list[SeatMapEntryRead]:
    entries = await service.get_seat_map(db, schedule_id, coach_id)
    return [SeatMapEntryRead(**e) for e in entries]