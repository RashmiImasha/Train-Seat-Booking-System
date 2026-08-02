import uuid, datetime
 
from fastapi import APIRouter, Depends, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
 
from app.core.deps import get_current_user, require_admin
from app.db.models import User, BookingStatus
from app.db.session import get_db
from app.modules.bookings import service
from app.schemas.booking import BookingCreate, BookingRead, BookingDetailRead
 
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

@booking_router.get("", response_model=list[BookingDetailRead], dependencies=[Depends(require_admin)])
async def list_bookings(
    status_filter: BookingStatus | None = Query(default=None, alias="status"),
    travel_date: datetime.date | None = Query(default=None),
    db: AsyncSession = Depends(get_db),
) -> list[BookingDetailRead]:
    bookings = await service.list_all_bookings(db, status_filter, travel_date)
    return [BookingDetailRead.model_validate(b) for b in bookings]

@booking_router.get("/me", response_model=list[BookingDetailRead])
async def get_all_bookings_per_user(    
    db: AsyncSession = Depends(get_db),    
    current_user: User = Depends(get_current_user),
) -> list[BookingDetailRead]:
    bookings = await service.list_my_bookings(db, current_user)
    return [BookingDetailRead.model_validate(b) for b in bookings]
 
@booking_router.get("/{booking_id}", response_model=BookingRead)
async def get_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = await service.get_booking_or_404(db, booking_id)
    return BookingRead.model_validate(booking)
 
# cancel seat booking - passenger
@booking_router.delete("/{booking_id}", response_model=BookingRead)
async def cancel_booking(
    booking_id: uuid.UUID,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
) -> BookingRead:
    booking = await service.cancel_booking(db, booking_id, current_user)
    return BookingRead.model_validate(booking)

# delete seat booking - admin
@booking_router.delete("/{booking_id}/purge", status_code=status.HTTP_204_NO_CONTENT, dependencies=[Depends(require_admin)])
async def purge_booking(booking_id: uuid.UUID, db: AsyncSession = Depends(get_db)) -> None:
    await service.delete_booking(db, booking_id)