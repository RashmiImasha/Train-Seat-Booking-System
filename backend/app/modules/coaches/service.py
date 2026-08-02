import uuid
 
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.models import Coach, CoachType, Seat
from app.modules.routes.service import get_route_or_404
from app.schemas.coach import CoachCreate
 
 
async def add_coach(db: AsyncSession, route_id: uuid.UUID, payload: CoachCreate) -> Coach:
    await get_route_or_404(db, route_id)
 
    coach = Coach(
        route_id=route_id,
        coach_number=payload.coach_number,
        coach_type=payload.coach_type,
        coach_name=payload.coach_name,
        seat_count=payload.seat_count,
    )
    db.add(coach)
    await db.flush()  # assigns coach.id without committing yet
 
    # Only reserved coaches get individually tracked physical seats -- segment
    # booking / seat_availability only applies to reserved coaches. Unreserved
    # coaches are first-come-first-served with no seat assignment, so
    # seat_count there is informational capacity only, not modeled per-seat.
    if coach.coach_type == CoachType.RESERVED:
        for seat_number in range(1, payload.seat_count + 1):
            db.add(Seat(coach_id=coach.id, seat_number=seat_number))
 
    await db.commit()
    await db.refresh(coach)
    return coach
 
 
async def list_coaches(db: AsyncSession, route_id: uuid.UUID) -> list[Coach]:
    await get_route_or_404(db, route_id)
    result = await db.execute(
        select(Coach).where(Coach.route_id == route_id).order_by(Coach.coach_number)
    )
    return list(result.scalars().all())