import uuid 
from pydantic import BaseModel, ConfigDict, Field 
from app.db.models import UserRole
 
 
class PassengerRegister(BaseModel):
    username: str = Field(..., min_length=3, max_length=255)
    password: str = Field(..., min_length=8, max_length=255)
 
 
class LoginRequest(BaseModel):
    username: str
    password: str
 
 
class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    role: UserRole
 
 
class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
 
    id: uuid.UUID
    username: str
    role: UserRole
 