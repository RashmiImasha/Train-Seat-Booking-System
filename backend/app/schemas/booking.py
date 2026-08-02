import datetime
import uuid
from decimal import Decimal

from pydantic import BaseModel, ConfigDict
 
from app.db.models import BookingStatus
 
 
class BookingCreate(BaseModel):
    origin_station_id: uuid.UUID
    destination_station_id: uuid.UUID
    # No passenger_name here -- the booking is tied to whichever user's JWT
    # made the request (see the current_user dependency in the router), not
    # a free-text field the client could spoof.
 
 
class BookingRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    seat_id: uuid.UUID
    train_schedule_id: uuid.UUID
    origin_station_id: uuid.UUID
    destination_station_id: uuid.UUID
    user_id: uuid.UUID
    fare: Decimal
    status: BookingStatus
    booked_at: datetime.datetime

class BookingDetailRead(BookingRead):
    route_name: str
    origin_station_name: str
    destination_station_name: str
    coach_number: int
    seat_number: int
    travel_date: datetime.date

    