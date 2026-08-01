from fastapi import HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import User, UserRole
from app.schemas.auth import LoginRequest, PassengerRegister, TokenResponse
 
 
async def register_passenger(db: AsyncSession, payload: PassengerRegister) -> User:
    existing = await db.execute(select(User).where(User.username == payload.username))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Username already taken")
 
    # Self-registration always creates a PASSENGER. There is no public
    # endpoint that can create an admin account -- the single admin user is
    # seeded directly at startup (see main.py), not through this flow.
    user = User(username=payload.username, hashed_password=hash_password(payload.password), role=UserRole.PASSENGER)
    db.add(user)
    await db.commit()
    await db.refresh(user)
    return user
 
 
async def login(db: AsyncSession, payload: LoginRequest) -> TokenResponse:
    result = await db.execute(select(User).where(User.username == payload.username))
    user = result.scalar_one_or_none()
 
    if user is None or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid username or password")
 
    token = create_access_token(user.id, user.role.value)
    return TokenResponse(access_token=token, role=user.role)