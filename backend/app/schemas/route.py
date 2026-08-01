import uuid 
from pydantic import BaseModel, ConfigDict, Field
 
 
class RouteCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
 
 
class RouteRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    name: str
 
 
class StationCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=255)
    sequence_order: int = Field(..., ge=0)
    distance_from_previous_km: int = Field(0, ge=0)
 
 
class StationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    route_id: uuid.UUID
    name: str
    sequence_order: int
    distance_from_previous_km: int