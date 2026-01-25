from fastapi import APIRouter, Depends, HTTPException
from app.database import get_db_connection
from app.model.location_model import LocationCreate, LocationResponse
from app.logic.location_logic import save_location, get_latest_location

router = APIRouter(prefix="/location", tags=["Location"])


@router.post("/", status_code=200)
def post_location(
    data: LocationCreate,
    conn=Depends(get_db_connection)
):
    # TODO later:
    # - check booking exists
    # - check technician assigned
    # - check booking is in_progress

    technician_id = 1  # TEMP: replace later with JWT-based technician ID

    save_location(
        conn=conn,
        booking_id=data.booking_id,
        technician_id=technician_id,
        latitude=data.latitude,
        longitude=data.longitude,
        accuracy=data.accuracy
    )

    return {"message": "Location recorded"}


@router.get("/{booking_id}", response_model=LocationResponse)
def get_location(
    booking_id: int,
    conn=Depends(get_db_connection)
):
    location = get_latest_location(conn, booking_id)

    if not location:
        raise HTTPException(status_code=404, detail="Location not found")

    return location
