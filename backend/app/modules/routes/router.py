import uuid
 
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.session import get_db
from app.modules.routes import service
from app.schemas.route import RouteCreate, RouteRead, StationCreate, StationRead
 
router = APIRouter(prefix="/routes", tags=["routes"])
 
 
@router.post("", response_model=RouteRead, status_code=status.HTTP_201_CREATED)
async def create_route(payload: RouteCreate, db: AsyncSession = Depends(get_db)) -> RouteRead:
    route = await service.create_route(db, payload)
    return RouteRead.model_validate(route)
 
 
@router.get("", response_model=list[RouteRead])
async def list_routes(db: AsyncSession = Depends(get_db)) -> list[RouteRead]:
    routes = await service.list_routes(db)
    return [RouteRead.model_validate(r) for r in routes]
 
 
@router.post(
    "/{route_id}/stations", response_model=StationRead, status_code=status.HTTP_201_CREATED
)
async def add_station(
    route_id: uuid.UUID, payload: StationCreate, db: AsyncSession = Depends(get_db)
) -> StationRead:
    station = await service.add_station(db, route_id, payload)
    return StationRead.model_validate(station)
 
 
@router.get("/{route_id}/stations", response_model=list[StationRead])
async def list_stations(route_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[StationRead]:
    stations = await service.list_stations(db, route_id)
    return [StationRead.model_validate(s) for s in stations]