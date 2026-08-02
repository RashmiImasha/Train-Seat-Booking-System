import uuid

from fastapi import HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.db.models import Station, TrainSchedule


async def validate_leg(
    db: AsyncSession, schedule: TrainSchedule, origin_station_id: uuid.UUID, destination_station_id: uuid.UUID
) -> tuple[Station, Station]:
    """
    Confirms both stations belong to the schedule's route and that origin
    comes before destination. Shared by availability, fare preview, and
    booking creation -- all three need exactly this check before doing
    anything with a leg.
    """
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
            status_code=status.HTTP_400_BAD_REQUEST, detail="origin must come before destination on the route"
        )

    return origin, destination