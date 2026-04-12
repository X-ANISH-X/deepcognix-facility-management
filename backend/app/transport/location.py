from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_payload
from app.database import get_db_connection
from app.logic.booking_logic import get_booking_by_id
from app.logic.location_logic import get_latest_location, save_location
from app.model.location_model import LocationCreate, LocationResponse

router = APIRouter(prefix="/location", tags=["Location"])


@router.post("/", status_code=200)
def post_location(
    data: LocationCreate,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user["role"] != "technician":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only technicians can post live location",
        )

    booking = get_booking_by_id(conn, data.booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if booking["technician_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="Booking is not assigned to you")

    if booking["status"] not in {"assigned", "in_progress"}:
        raise HTTPException(status_code=400, detail="Live tracking is available for assigned jobs only")

    save_location(
        conn=conn,
        booking_id=data.booking_id,
        technician_id=current_user["id"],
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy,
    )

    return {"message": "Location recorded"}


@router.get("/{booking_id}", response_model=LocationResponse)
def get_location(
    booking_id: int,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    booking = get_booking_by_id(conn, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user["role"] == "customer" and booking["customer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot view this live location")

    if current_user["role"] == "technician" and booking["technician_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot view this live location")

    location = get_latest_location(conn, booking_id)

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    return location
