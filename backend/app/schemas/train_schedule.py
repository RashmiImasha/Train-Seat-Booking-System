import datetime, uuid
from pydantic import BaseModel, ConfigDict, Field
 

class TrainScheduleCreate(BaseModel):
    route_id: uuid.UUID
    travel_date: datetime.date
 
 
class TrainScheduleRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    route_id: uuid.UUID
    travel_date: datetime.date
 
 