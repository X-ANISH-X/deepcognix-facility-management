from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db_connection
from app.logic import booking_logic
from app.model.booking_model import BookingCreate, BookingResponse

router = APIRouter(prefix="/bookings", tags=["Bookings"])


@router.post("/", response_model=dict, status_code=201)
def create_booking(booking: BookingCreate, db=Depends(get_db_connection)):
    booking_id = booking_logic.create_booking(db, booking)
    return {"message": "Booking created", "booking_id": booking_id}


@router.get("/", response_model=list[dict])
def list_bookings(db=Depends(get_db_connection)):
    return booking_logic.list_bookings(db)


@router.get("/{booking_id}", response_model=dict)
def get_booking(booking_id: int, db=Depends(get_db_connection)):
    booking = booking_logic.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    return booking
