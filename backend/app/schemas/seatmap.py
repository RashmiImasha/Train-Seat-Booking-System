import uuid
from typing import Literal

from pydantic import BaseModel


class BookedSegmentRead(BaseModel):
    origin_station_name: str
    destination_station_name: str


class SeatMapEntryRead(BaseModel):
    seat_id: uuid.UUID
    seat_number: int
    coach_id: uuid.UUID
    coach_number: int
    status: Literal["free", "partial", "full"]
    booked_segments: list[BookedSegmentRead]