from fastapi import FastAPI
 
from app.db.models import Base
from app.db.session import engine
from app.modules.availability.router import router as availability_router
#from app.modules.bookings.router import booking_creation_router, booking_router
from app.modules.coaches.router import router as coaches_router
from app.modules.routes.router import router as routes_router
from app.modules.schedules.router import router as schedules_router
from app.modules.users.router import router as users_router

app = FastAPI(title="Train Seat Booking System")

app.include_router(users_router)
app.include_router(routes_router)
app.include_router(coaches_router)
app.include_router(schedules_router)
app.include_router(availability_router)
#app.include_router(booking_creation_router)
#app.include_router(booking_router)
 
 
@app.on_event("startup")
async def on_startup() -> None:
    # NOTE: create_all is a stopgap for this stage of the project so the app
    # is runnable in one shot without a separate migration step. This will
    # be replaced with proper Alembic migrations once the schema stabilizes
    # (create_all can't handle schema changes to existing tables).
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
async def root() -> dict[str, str]:
    return {"message": "Train Seat Booking API", "docs": "/docs"}
 
@app.get("/health")
async def health() -> dict[str, str]:
    return {"status": "ok"}