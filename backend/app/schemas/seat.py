import uuid 
from pydantic import BaseModel, ConfigDict, Field
 
from app.db.models import CoachType
 
class SeatRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    coach_id: uuid.UUID
    seat_number: int
 
 
class CoachWithSeatsRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    coach_number: int
    coach_type: CoachType
    seat_count: int
    seats: list[SeatRead] = Field(default_factory=list)

class AvailableSeatRead(BaseModel):
    seat_id: uuid.UUID
    seat_number: int
    coach_id: uuid.UUID
    coach_number: int