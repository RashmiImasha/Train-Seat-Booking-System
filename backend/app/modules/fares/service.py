from decimal import Decimal
import uuid

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.validation import validate_leg
from app.db.models import Station
from app.modules.schedules.service import get_schedule_or_404

# A flat rate per km, applied uniformly across the route for now. Kept as a
# single constant here (rather than hardcoded inline in the calculation) so
# it's the one place to change if this becomes configurable per-route later,
# or if Extra Credit fare logic (peak pricing, coach-type multiplier, etc.)
# gets layered on top.
RATE_PER_KM = Decimal("10.00")


async def calculate_fare(db: AsyncSession, route_id, origin_sequence: int, destination_sequence: int) -> Decimal:
    """
    Fare = sum of distance_from_previous_km for every station strictly after
    origin up to and including destination, times a flat rate per km. This
    charges the passenger only for the distance they actually travel -- the
    core fix to the "double fare for a partial journey" problem described in
    the assignment brief.
    """
    result = await db.execute(
        select(Station.distance_from_previous_km).where(
            Station.route_id == route_id,
            Station.sequence_order > origin_sequence,
            Station.sequence_order <= destination_sequence,
        )
    )
    total_km = sum(result.scalars().all())
    return Decimal(total_km) * RATE_PER_KM


async def preview_fare(
    db: AsyncSession, schedule_id: uuid.UUID, origin_station_id: uuid.UUID, destination_station_id: uuid.UUID
) -> Decimal:
    """
    Lets the frontend show a fare BEFORE the passenger commits to a booking
    -- reuses the exact same calculate_fare used at booking time, so the
    preview is always accurate (no risk of a separate estimate formula
    drifting from what actually gets charged).
    """
    schedule = await get_schedule_or_404(db, schedule_id)
    origin, destination = await validate_leg(db, schedule, origin_station_id, destination_station_id)
    return await calculate_fare(db, schedule.route_id, origin.sequence_order, destination.sequence_order)
