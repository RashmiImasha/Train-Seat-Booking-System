import uuid
from decimal import Decimal

from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.validation import validate_leg
from app.db.models import Coach, CoachName, Seat, Station
from app.modules.schedules.service import get_schedule_or_404

# distance based fare
RATE_PER_KM = Decimal("10.00")

# Class premium based fare
COACH_FARE_MULTIPLIER: dict[CoachName, Decimal] = {
    CoachName.CLASS_1: Decimal("2.00"),
    CoachName.CLASS_2: Decimal("1.50"),
    CoachName.CLASS_3: Decimal("1.00"),
}


async def get_coach_name_for_seat(db: AsyncSession, seat_id: uuid.UUID) -> CoachName:
    """
    Resolves which coach class a seat belongs to. Shared by preview_fare and
    the booking service, so both use the exact same lookup -- no risk of
    the preview computing a different class than what's actually charged.
    """
    result = await db.execute(
        select(Coach.coach_name).join(Seat, Seat.coach_id == Coach.id).where(Seat.id == seat_id)
    )
    coach_name = result.scalar_one_or_none()
    if coach_name is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Seat not found")
    return coach_name


async def calculate_fare(
    db: AsyncSession, route_id, origin_sequence: int, destination_sequence: int, coach_name: CoachName
) -> Decimal:
    """
    Fare = (sum of distance_from_previous_km for every station strictly
    after origin up to and including destination) x rate per km x the
    coach class multiplier. Distance-based pricing fixes the "double fare
    for a partial journey" problem from the brief; the multiplier layers
    class-based pricing on top of that, without changing the underlying
    distance logic at all.
    """
    result = await db.execute(
        select(Station.distance_from_previous_km).where(
            Station.route_id == route_id,
            Station.sequence_order > origin_sequence,
            Station.sequence_order <= destination_sequence,
        )
    )
    total_km = sum(result.scalars().all())
    base_fare = Decimal(total_km) * RATE_PER_KM
    return base_fare * COACH_FARE_MULTIPLIER[coach_name]


async def preview_fare(
    db: AsyncSession,
    schedule_id: uuid.UUID,
    seat_id: uuid.UUID,
    origin_station_id: uuid.UUID,
    destination_station_id: uuid.UUID,
) -> Decimal:
    """
    Lets the frontend show a fare BEFORE the passenger commits to a booking
    -- reuses the exact same calculate_fare (and the exact same coach-name
    lookup) used at booking time, so the preview is always accurate.
    """
    schedule = await get_schedule_or_404(db, schedule_id)
    origin, destination = await validate_leg(db, schedule, origin_station_id, destination_station_id)
    coach_name = await get_coach_name_for_seat(db, seat_id)
    return await calculate_fare(db, schedule.route_id, origin.sequence_order, destination.sequence_order, coach_name)