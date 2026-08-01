import datetime, uuid
 
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.exc import IntegrityError
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload
 
from app.db.models import Coach, CoachType, Seat, SeatAvailability, Station, TrainSchedule
from app.modules.routes.service import get_route_or_404
from app.schemas.train_schedule import TrainScheduleCreate
 
 
async def create_schedule(db: AsyncSession, payload: TrainScheduleCreate) -> TrainSchedule:
    route = await get_route_or_404(db, payload.route_id)
 
    # A route needs at least 2 stations to have any bookable segments at all.
    station_count_result = await db.execute(select(Station).where(Station.route_id == route.id))
    stations = list(station_count_result.scalars().all())
    if len(stations) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Route must have at least 2 stations before a schedule can be created",
        )
 
    schedule = TrainSchedule(route_id=payload.route_id, travel_date=payload.travel_date)
    db.add(schedule)
    try:
        await db.flush()  # triggers the uq_schedule_route_date constraint if duplicate
    except IntegrityError:
        await db.rollback()
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A schedule for this route on this date already exists",
        )
 
    # Provision one seat_availability row (mask = 0, fully free) per physical
    # seat in every RESERVED coach on this route. Unreserved coaches have no
    # per-seat rows (see coaches/service.py), so nothing to provision there.
    seats_result = await db.execute(
        select(Seat).join(Coach).where(Coach.route_id == route.id, Coach.coach_type == CoachType.RESERVED)
    )
    seats = list(seats_result.scalars().all())
 
    for seat in seats:
        db.add(SeatAvailability(seat_id=seat.id, train_schedule_id=schedule.id, occupied_mask=0))
 
    await db.commit()
    await db.refresh(schedule)
    return schedule
 
 
async def get_schedule_or_404(db: AsyncSession, schedule_id: uuid.UUID) -> TrainSchedule:
    schedule = await db.get(TrainSchedule, schedule_id)
    if schedule is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Train schedule not found")
    return schedule
 
 
async def find_schedules(
    db: AsyncSession, route_id: uuid.UUID | None, travel_date: datetime.date | None
) -> list[TrainSchedule]:
    query = select(TrainSchedule)
    if route_id is not None:
        query = query.where(TrainSchedule.route_id == route_id)
    if travel_date is not None:
        query = query.where(TrainSchedule.travel_date == travel_date)
    result = await db.execute(query)
    return list(result.scalars().all())
 
 
async def list_coaches_with_seats(db: AsyncSession, schedule_id: uuid.UUID) -> list[Coach]:
    schedule = await get_schedule_or_404(db, schedule_id)
    result = await db.execute(
        select(Coach)
        .where(Coach.route_id == schedule.route_id)
        .options(selectinload(Coach.seats))
        .order_by(Coach.coach_number)
    )
    return list(result.scalars().all())