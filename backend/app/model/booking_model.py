from pydantic import BaseModel
from typing import Optional
from datetime import date, time

# What client sends when creating a booking
class BookingCreate(BaseModel):
    customer_id: int
    service_id: int

    scheduled_date: date
    scheduled_time_slot: time

    address_line: str
    building_name: str
    floor_number: str
    apartment_number: str

    latitude: Optional[float] = None
    longitude: Optional[float] = None
    customer_notes: Optional[str] = None


# What API returns
class BookingResponse(BaseModel):
    id: int
    customer_id: int
    service_id: int
    status: str
    scheduled_date: date
    scheduled_time_slot: time
