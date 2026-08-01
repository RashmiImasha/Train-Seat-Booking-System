from decimal import Decimal
 
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.models import Station
 
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