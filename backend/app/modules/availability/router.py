import uuid
 
from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.session import get_db
from app.modules.availability import service
from app.schemas.seat import AvailableSeatRead
 
router = APIRouter(prefix="/schedules/{schedule_id}/availability", tags=["availability"])
 
 
@router.get("", response_model=list[AvailableSeatRead])
async def get_available_seats(
    schedule_id: uuid.UUID,
    origin: uuid.UUID = Query(..., description="origin station id"),
    destination: uuid.UUID = Query(..., description="destination station id"),
    db: AsyncSession = Depends(get_db),
) -> list[AvailableSeatRead]:
    return await service.get_available_seats(db, schedule_id, origin, destination)