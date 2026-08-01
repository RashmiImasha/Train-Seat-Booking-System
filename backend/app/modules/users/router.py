from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.db.session import get_db
from app.modules.users import service
from app.schemas.auth import LoginRequest, PassengerRegister, TokenResponse, UserRead
 
router = APIRouter(prefix="/user", tags=["users"])
 
 
@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
async def register_passenger(payload: PassengerRegister, db: AsyncSession = Depends(get_db)) -> UserRead:
    user = await service.register_passenger(db, payload)
    return UserRead.model_validate(user)
 
 
@router.post("/login", response_model=TokenResponse)
async def login(payload: LoginRequest, db: AsyncSession = Depends(get_db)) -> TokenResponse:
    return await service.login(db, payload)
 