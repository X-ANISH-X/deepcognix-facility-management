from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db_connection
from app.logic import booking_logic
from app.logic.booking_logic import start_job, complete_job
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


@router.post("/{booking_id}/start")
def start_booking(booking_id: int, conn=Depends(get_db_connection)):
    technician_id = 1  # TEMP

    success, error = start_job(conn, booking_id, technician_id)
    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Job started successfully"}


@router.post("/{booking_id}/complete")
def complete_booking(booking_id: int, conn=Depends(get_db_connection)):
    technician_id = 1  # TEMP, JWT later

    success, error = complete_job(
        conn=conn,
        booking_id=booking_id,
        technician_id=technician_id
    )

    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Job completed successfully"}
