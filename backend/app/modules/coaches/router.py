import uuid
 
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.session import get_db
from app.modules.coaches import service
from app.schemas.coach import CoachCreate, CoachRead
 
router = APIRouter(prefix="/routes/{route_id}/coaches", tags=["coaches"])
 
 
@router.post("", response_model=CoachRead, status_code=status.HTTP_201_CREATED)
async def add_coach(
    route_id: uuid.UUID, payload: CoachCreate, db: AsyncSession = Depends(get_db)
) -> CoachRead:
    coach = await service.add_coach(db, route_id, payload)
    return CoachRead.model_validate(coach)
 
 
@router.get("", response_model=list[CoachRead])
async def list_coaches(route_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> list[CoachRead]:
    coaches = await service.list_coaches(db, route_id)
    return [CoachRead.model_validate(c) for c in coaches]