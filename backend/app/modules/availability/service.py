import uuid
 
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.segments import leg_mask
from app.db.models import Coach, CoachType, Seat, SeatAvailability, Station
from app.modules.schedules.service import get_schedule_or_404
from app.schemas.seat import AvailableSeatRead
 
 
async def get_available_seats(
    db: AsyncSession,
    schedule_id: uuid.UUID,
    origin_station_id: uuid.UUID,
    destination_station_id: uuid.UUID,
) -> list[AvailableSeatRead]:
    schedule = await get_schedule_or_404(db, schedule_id)
 
    origin = await db.get(Station, origin_station_id)
    destination = await db.get(Station, destination_station_id)
 
    if origin is None or origin.route_id != schedule.route_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="origin station is not on this schedule's route")
    if destination is None or destination.route_id != schedule.route_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="destination station is not on this schedule's route"
        )
    if origin.sequence_order >= destination.sequence_order:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="origin must come before destination on the route",
        )
 
    query_mask = leg_mask(origin.sequence_order, destination.sequence_order)
 
    # Only reserved-coach seats have seat_availability rows at all (see
    # coaches/service.py); the bitwise AND against query_mask is the actual
    # overlap check -- a seat is free for this leg iff none of its already
    # booked segments intersect the requested leg's segments.
    result = await db.execute(
        select(SeatAvailability, Seat, Coach)
        .join(Seat, SeatAvailability.seat_id == Seat.id)
        .join(Coach, Seat.coach_id == Coach.id)
        .where(
            SeatAvailability.train_schedule_id == schedule_id,
            Coach.coach_type == CoachType.RESERVED,
            SeatAvailability.occupied_mask.op("&")(query_mask) == 0,
        )
        .order_by(Coach.coach_number, Seat.seat_number)
    )
 
    return [
        AvailableSeatRead(
            seat_id=seat.id,
            seat_number=seat.seat_number,
            coach_id=coach.id,
            coach_number=coach.coach_number,
            coach_name=coach.coach_name,
        )
        for _availability, seat, coach in result.all()
    ]