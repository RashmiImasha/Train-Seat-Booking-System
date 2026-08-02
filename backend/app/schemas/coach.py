import uuid 
from pydantic import BaseModel, ConfigDict, Field
 
from app.db.models import CoachName, CoachType
 
 
class CoachCreate(BaseModel):
    coach_number: int = Field(..., ge=1)
    coach_type: CoachType
    coach_name: CoachName
    seat_count: int = Field(..., ge=1)
 
 
class CoachRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    route_id: uuid.UUID
    coach_number: int
    coach_type: CoachType
    coach_name: CoachName
    seat_count: int
 