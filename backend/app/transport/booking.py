from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_payload
from app.database import get_db_connection
from app.logic import booking_logic
from app.logic.booking_logic import approve_job_rejection, complete_job, request_job_rejection, start_job
from app.model.booking_model import (
    AssignTechnicianRequest,
    BookingChecklistTaskUpdate,
    BookingCreate,
    RejectBookingRequest,
)

router = APIRouter(prefix="/bookings", tags=["Bookings"])


def _ensure_roles(current_user: dict, allowed_roles: set[str]):
    if current_user["role"] not in allowed_roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You are not allowed to perform this action",
        )


@router.post("/", response_model=dict, status_code=201)
def create_booking(
    booking: BookingCreate,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"customer", "admin"})

    customer_id = booking.customer_id
    if current_user["role"] == "customer":
        customer_id = current_user["id"]
    elif customer_id is None:
        raise HTTPException(status_code=400, detail="customer_id is required for admin bookings")

    try:
        booking_id = booking_logic.create_booking(db, booking, customer_id)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    return {"message": "Booking created", "booking_id": booking_id}


@router.get("/", response_model=list[dict])
def list_bookings(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    return booking_logic.list_bookings(db, current_user["id"], current_user["role"])


@router.get("/{booking_id}", response_model=dict)
def get_booking(
    booking_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    booking = booking_logic.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user["role"] == "customer" and booking["customer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot view this booking")

    if current_user["role"] == "technician" and booking["technician_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot view this booking")

    return booking


@router.post("/{booking_id}/approve")
def approve_booking(
    booking_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"admin"})
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, status FROM bookings WHERE id = %s", (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if booking["status"] != "submitted":
            raise HTTPException(status_code=400, detail=f"Cannot approve a booking with status '{booking['status']}'")
        cursor.execute("UPDATE bookings SET status = 'approved' WHERE id = %s", (booking_id,))
        db.commit()
        return {"message": "Booking approved successfully"}
    finally:
        cursor.close()


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"admin", "customer"})
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, status, customer_id FROM bookings WHERE id = %s", (booking_id,))
        booking = cursor.fetchone()
        if not booking:
            raise HTTPException(status_code=404, detail="Booking not found")
        if current_user["role"] == "customer" and booking["customer_id"] != current_user["id"]:
            raise HTTPException(status_code=403, detail="You cannot cancel this booking")
        cancellable = {"submitted", "approved"}
        if booking["status"] not in cancellable:
            raise HTTPException(status_code=400, detail=f"Cannot cancel a booking with status '{booking['status']}'")
        cursor.execute("UPDATE bookings SET status = 'cancelled' WHERE id = %s", (booking_id,))
        db.commit()
        return {"message": "Booking cancelled successfully"}
    finally:
        cursor.close()


@router.post("/{booking_id}/assign")
def assign_booking(
    booking_id: int,
    payload: AssignTechnicianRequest,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"admin"})
    success, error = booking_logic.assign_booking(db, booking_id, payload.technician_id)
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Booking assigned successfully"}


@router.get("/{booking_id}/tasks")
def get_booking_tasks(
    booking_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    booking = booking_logic.get_booking_by_id(db, booking_id)
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")

    if current_user["role"] == "customer" and booking["customer_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot view these tasks")

    if current_user["role"] == "technician" and booking["technician_id"] != current_user["id"]:
        raise HTTPException(status_code=403, detail="You cannot view these tasks")

    return booking_logic.get_booking_tasks(db, booking_id)


@router.patch("/{booking_id}/tasks/{task_id}")
def update_booking_task(
    booking_id: int,
    task_id: int,
    payload: BookingChecklistTaskUpdate,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"technician"})
    success, error = booking_logic.update_booking_task_status(
        db,
        booking_id,
        task_id,
        current_user["id"],
        payload.is_completed,
    )
    if not success:
        raise HTTPException(status_code=400, detail=error)
    return {"message": "Task status updated"}


@router.post("/{booking_id}/start")
def start_booking(
    booking_id: int,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"technician"})
    success, error = start_job(conn, booking_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Job started successfully"}


@router.post("/{booking_id}/reject")
def reject_booking(
    booking_id: int,
    payload: RejectBookingRequest,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"technician"})
    success, error = request_job_rejection(conn, booking_id, current_user["id"], payload.reason)
    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Job rejection request sent to admin"}


@router.post("/{booking_id}/rejection/approve")
def approve_rejection_request(
    booking_id: int,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"admin"})
    success, error = approve_job_rejection(conn, booking_id, current_user["id"])
    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Job rejection approved"}


@router.post("/{booking_id}/complete")
def complete_booking(
    booking_id: int,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _ensure_roles(current_user, {"technician"})
    success, error = complete_job(
        conn=conn,
        booking_id=booking_id,
        technician_id=current_user["id"],
    )

    if not success:
        raise HTTPException(status_code=400, detail=error)

    return {"message": "Job completed successfully"}
