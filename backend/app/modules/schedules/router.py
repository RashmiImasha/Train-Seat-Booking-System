import datetime
import uuid
 
from fastapi import APIRouter, Depends, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.deps import require_admin
from app.db.session import get_db
from app.modules.schedules import service
from app.schemas.train_schedule import TrainScheduleCreate, TrainScheduleRead
from app.schemas.seat import CoachWithSeatsRead
 
router = APIRouter(prefix="/schedules", tags=["schedules"])
  
@router.post("", response_model=TrainScheduleRead, status_code=status.HTTP_201_CREATED, dependencies=[Depends(require_admin)])
async def create_schedule(
    payload: TrainScheduleCreate, db: AsyncSession = Depends(get_db)
) -> TrainScheduleRead:
    schedule = await service.create_schedule(db, payload)
    return TrainScheduleRead.model_validate(schedule)
 
 
@router.get("", response_model=list[TrainScheduleRead])
async def find_schedules(
    route_id: uuid.UUID | None = Query(default=None),
    travel_date: datetime.date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[TrainScheduleRead]:
    schedules = await service.find_schedules(db, route_id, travel_date)
    return [TrainScheduleRead.model_validate(s) for s in schedules]
 
 
@router.get("/{schedule_id}/coaches", response_model=list[CoachWithSeatsRead])
async def list_coaches(schedule_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[CoachWithSeatsRead]:
    coaches = await service.list_coaches_with_seats(db, schedule_id)
    return [CoachWithSeatsRead.model_validate(c) for c in coaches]