from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import select
 
from app.config import ADMIN_PASSWORD, ADMIN_USERNAME, get_settings
from app.core.security import hash_password 
from app.db.models import Base, User, UserRole
from app.db.session import AsyncSessionLocal, engine
from app.modules.availability.router import router as availability_router
from app.modules.bookings.router import booking_creation_router, booking_router
from app.modules.coaches.router import router as coaches_router
from app.modules.routes.router import router as routes_router
from app.modules.schedules.router import router as schedules_router
from app.modules.fares.router import router as fares_router
from app.modules.users.router import router as users_router

settings = get_settings()

app = FastAPI(title="Train Seat Booking System")

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users_router)
app.include_router(routes_router)
app.include_router(coaches_router)
app.include_router(schedules_router)
app.include_router(availability_router)
app.include_router(booking_creation_router)
app.include_router(booking_router)
app.include_router(fares_router)

async def _seed_admin_user() -> None:
    
    async with AsyncSessionLocal() as session:
        result = await session.execute(select(User).where(User.username == ADMIN_USERNAME))
        admin = result.scalar_one_or_none()
        if admin is None:
            session.add(
                User(username=ADMIN_USERNAME, hashed_password=hash_password(ADMIN_PASSWORD), role=UserRole.ADMIN)
            )
            await session.commit()
 
 
@app.on_event("startup")
async def on_startup() -> None:
    
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

    await _seed_admin_user()

 
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}