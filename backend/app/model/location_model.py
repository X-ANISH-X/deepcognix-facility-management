from pydantic import BaseModel
from typing import Optional
from datetime import datetime


class LocationCreate(BaseModel):
    booking_id: int
    latitude: float
    longitude: float
    accuracy: Optional[float] = None


class LocationResponse(BaseModel):
    booking_id: int
    technician_id: int
    latitude: float
    longitude: float
    accuracy: Optional[float]
    recorded_at: datetime
