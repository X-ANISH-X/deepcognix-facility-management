from datetime import date
from typing import Literal

from pydantic import BaseModel


TimeSlot = Literal["09:00 AM", "11:00 AM", "01:00 PM", "03:00 PM", "05:00 PM"]


class BookingCreate(BaseModel):
    customer_id: int | None = None
    service_id: int
    package_id: int
    scheduled_date: date
    scheduled_time_slot: TimeSlot
    address_line: str
    building_name: str | None = None
    floor_number: str | None = None
    apartment_number: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    customer_notes: str | None = None
    preferred_technician: str | None = None
    parking_instructions: str | None = None
    pet_warning: str | None = None
    call_before_arrival: bool = False


class BookingResponse(BaseModel):
    id: int
    customer_id: int
    service_id: int
    package_id: int
    technician_id: int | None = None
    status: str
    final_price: float | None = None
    scheduled_date: date
    scheduled_time_slot: TimeSlot
    address_line: str
    building_name: str | None = None
    floor_number: str | None = None
    apartment_number: str | None = None
    latitude: float | None = None
    longitude: float | None = None
    customer_notes: str | None = None
    preferred_technician: str | None = None
    parking_instructions: str | None = None
    pet_warning: str | None = None
    call_before_arrival: bool = False
    technician_notes: str | None = None


class AssignTechnicianRequest(BaseModel):
    technician_id: int


class BookingChecklistItemResponse(BaseModel):
    id: int
    booking_id: int
    task_name: str
    order_index: int | None = None
    is_completed: bool


class BookingChecklistTaskUpdate(BaseModel):
    is_completed: bool


class RejectBookingRequest(BaseModel):
    reason: str


class CompleteBookingRequest(BaseModel):
    notes: str | None = None
