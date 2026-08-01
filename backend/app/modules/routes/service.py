import uuid
 
from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.models import Route, Station
from app.schemas.route import RouteCreate, StationCreate
 
 
async def create_route(db: AsyncSession, payload: RouteCreate) -> Route:
    route = Route(name=payload.name)
    db.add(route)
    await db.commit()
    await db.refresh(route)
    return route
 
 
async def list_routes(db: AsyncSession) -> list[Route]:
    result = await db.execute(select(Route))
    return list(result.scalars().all())
 
 
async def get_route_or_404(db: AsyncSession, route_id: uuid.UUID) -> Route:
    route = await db.get(Route, route_id)
    if route is None:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Route not found")
    return route
 
 
async def add_station(db: AsyncSession, route_id: uuid.UUID, payload: StationCreate) -> Station:
    # Ensure the route exists before attaching a station to it.
    await get_route_or_404(db, route_id)
 
    # sequence_order must be unique per route -- this is enforced by a DB
    # constraint too, but checking here gives a clean 409 instead of a raw
    # integrity-error leaking to the client.
    existing = await db.execute(
        select(Station).where(Station.route_id == route_id, Station.sequence_order == payload.sequence_order)
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"A station already exists at sequence_order={payload.sequence_order} for this route",
        )
 
    station = Station(
        route_id=route_id,
        name=payload.name,
        sequence_order=payload.sequence_order,
        distance_from_previous_km=payload.distance_from_previous_km,
    )
    db.add(station)
    await db.commit()
    await db.refresh(station)
    return station
 
 
async def list_stations(db: AsyncSession, route_id: uuid.UUID) -> list[Station]:
    await get_route_or_404(db, route_id)
    result = await db.execute(
        select(Station).where(Station.route_id == route_id).order_by(Station.sequence_order)
    )
    return list(result.scalars().all())