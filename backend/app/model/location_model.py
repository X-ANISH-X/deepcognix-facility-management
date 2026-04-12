from datetime import datetime

from pydantic import BaseModel


class LocationCreate(BaseModel):
    booking_id: int
    latitude: float
    longitude: float
    accuracy: float | None = None


class LocationResponse(BaseModel):
    booking_id: int
    technician_id: int
    latitude: float
    longitude: float
    accuracy: float | None = None
    recorded_at: datetime
