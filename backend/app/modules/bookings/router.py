import uuid
 
from fastapi import APIRouter, Depends, status
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.deps import get_current_user
from app.db.models import User
from app.db.session import get_db
from app.modules.bookings import service
from app.schemas.booking import BookingCreate, BookingRead
 
booking_creation_router = APIRouter(
    prefix="/schedules/{schedule_id}/seats/{seat_id}/bookings", tags=["bookings"]
)
booking_router = APIRouter(prefix="/bookings", tags=["bookings"])
 
 
@booking_creation_router.post("", response_model=BookingRead, status_code=status.HTTP_201_CREATED)
async def create_booking(
    schedule_id: uuid.UUID,
    seat_id: uuid.UUID,
    payload: BookingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = await service.create_booking(db, schedule_id, seat_id, payload, current_user)
    return BookingRead.model_validate(booking)
 
 
@booking_router.get("/{booking_id}", response_model=BookingRead)
async def get_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = await service.get_booking_or_404(db, booking_id)
    return BookingRead.model_validate(booking)
 
 
@booking_router.delete("/{booking_id}", response_model=BookingRead)
async def cancel_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = await service.cancel_booking(db, booking_id, current_user)
    return BookingRead.model_validate(booking)