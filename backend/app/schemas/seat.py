import uuid 
from pydantic import BaseModel, ConfigDict, Field
 
from app.db.models import CoachType, CoachName
 
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
    coach_name: CoachName
    seat_count: int
    seats: list[SeatRead] = Field(default_factory=list)

class AvailableSeatRead(BaseModel):
    seat_id: uuid.UUID
    seat_number: int
    coach_id: uuid.UUID
    coach_number: int
    coach_name: CoachName