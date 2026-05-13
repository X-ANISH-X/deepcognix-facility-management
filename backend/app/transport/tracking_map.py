from __future__ import annotations

from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_payload
from app.database import get_db_connection

router = APIRouter(prefix="/api", tags=["Tracking Map"])


def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def _as_float(value):
    try:
        return float(value) if value is not None else None
    except (TypeError, ValueError):
        return None


def _derive_technician_status(is_active: bool, latest_booking_status: str | None) -> str:
    if not is_active:
        return "offline"

    normalized = (latest_booking_status or "").strip().lower()
    if normalized in {"in_progress"}:
        return "onsite"
    if normalized in {"on_the_way", "arrival_approval_pending"}:
        return "enroute"
    if normalized in {"assigned", "approved", "customer_review_pending", "admin_review_pending", "completion_requested"}:
        return "assigned"
    return "available"


@router.get("/technicians/locations")
def list_technician_locations(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                u.id,
                u.full_name,
                u.email,
                u.phone_number,
                u.is_active,
                (
                    SELECT COUNT(*)
                    FROM bookings b
                    WHERE b.technician_id = u.id
                      AND b.status IN ('assigned', 'in_progress', 'customer_review_pending', 'admin_review_pending', 'completion_requested')
                ) AS current_jobs,
                (
                    SELECT b.status
                    FROM bookings b
                    WHERE b.technician_id = u.id
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT 1
                ) AS latest_booking_status,
                (
                    SELECT b.id
                    FROM bookings b
                    WHERE b.technician_id = u.id
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT 1
                ) AS latest_booking_id,
                (
                    SELECT b.address_line
                    FROM bookings b
                    WHERE b.technician_id = u.id
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT 1
                ) AS booking_address,
                (
                    SELECT b.latitude
                    FROM bookings b
                    WHERE b.technician_id = u.id
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT 1
                ) AS booking_latitude,
                (
                    SELECT b.longitude
                    FROM bookings b
                    WHERE b.technician_id = u.id
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT 1
                ) AS booking_longitude,
                (
                    SELECT ll.latitude
                    FROM technician_live_locations ll
                    WHERE ll.technician_id = u.id
                    ORDER BY ll.recorded_at DESC, ll.id DESC
                    LIMIT 1
                ) AS live_latitude,
                (
                    SELECT ll.longitude
                    FROM technician_live_locations ll
                    WHERE ll.technician_id = u.id
                    ORDER BY ll.recorded_at DESC, ll.id DESC
                    LIMIT 1
                ) AS live_longitude,
                (
                    SELECT COALESCE(MAX(ll.recorded_at), NULL)
                    FROM technician_live_locations ll
                    WHERE ll.technician_id = u.id
                ) AS location_recorded_at
            FROM users u
            WHERE u.role = 'technician'
            ORDER BY u.is_active DESC, u.id DESC
            """
        )

        rows = cursor.fetchall()
        technicians: list[dict] = []
        for row in rows:
            live_latitude = _as_float(row.get("live_latitude"))
            live_longitude = _as_float(row.get("live_longitude"))
            booking_latitude = _as_float(row.get("booking_latitude"))
            booking_longitude = _as_float(row.get("booking_longitude"))
            is_active = bool(row.get("is_active", True))
            latest_booking_status = row.get("latest_booking_status")

            latitude = live_latitude if live_latitude is not None else booking_latitude
            longitude = live_longitude if live_longitude is not None else booking_longitude

            technicians.append(
                {
                    "id": row.get("id"),
                    "full_name": row.get("full_name") or "Technician",
                    "email": row.get("email") or "",
                    "phone_number": row.get("phone_number") or "",
                    "is_active": is_active,
                    "current_jobs": int(row.get("current_jobs") or 0),
                    "latest_booking_status": latest_booking_status,
                    "latest_booking_id": row.get("latest_booking_id"),
                    "booking_address": row.get("booking_address") or "N/A",
                    "booking_latitude": booking_latitude,
                    "booking_longitude": booking_longitude,
                    "live_latitude": live_latitude,
                    "live_longitude": live_longitude,
                    "latitude": latitude,
                    "longitude": longitude,
                    "location_recorded_at": row.get("location_recorded_at"),
                    "status": _derive_technician_status(is_active, latest_booking_status),
                    "location_source": (
                        "live"
                        if live_latitude is not None and live_longitude is not None
                        else "booking"
                        if booking_latitude is not None and booking_longitude is not None
                        else "fallback"
                    ),
                }
            )

        return {"technicians": technicians}
    finally:
        cursor.close()


@router.get("/users/locations")
def list_user_locations(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                b.id AS booking_id,
                b.customer_id,
                c.full_name AS customer_name,
                c.email AS customer_email,
                c.phone_number AS customer_phone,
                b.service_id,
                s.name AS service_name,
                b.package_id,
                p.name AS package_name,
                b.status,
                b.address_line,
                b.building_name,
                b.floor_number,
                b.apartment_number,
                b.latitude,
                b.longitude,
                b.created_at,
                b.updated_at,
                b.technician_id,
                t.full_name AS technician_name
            FROM bookings b
            INNER JOIN users c ON c.id = b.customer_id
            INNER JOIN services s ON s.id = b.service_id
            INNER JOIN packages p ON p.id = b.package_id
            LEFT JOIN users t ON t.id = b.technician_id
            WHERE b.latitude IS NOT NULL
              AND b.longitude IS NOT NULL
            ORDER BY b.updated_at DESC, b.id DESC
            """
        )
        rows = cursor.fetchall()

        users: list[dict] = []
        for row in rows:
            users.append(
                {
                    "booking_id": row.get("booking_id"),
                    "customer_id": row.get("customer_id"),
                    "customer_name": row.get("customer_name") or "Customer",
                    "customer_email": row.get("customer_email") or "",
                    "customer_phone": row.get("customer_phone") or "",
                    "service_id": row.get("service_id"),
                    "service_name": row.get("service_name") or "",
                    "package_id": row.get("package_id"),
                    "package_name": row.get("package_name") or "",
                    "status": row.get("status") or "submitted",
                    "address_line": row.get("address_line") or "",
                    "building_name": row.get("building_name") or "",
                    "floor_number": row.get("floor_number") or "",
                    "apartment_number": row.get("apartment_number") or "",
                    "latitude": _as_float(row.get("latitude")),
                    "longitude": _as_float(row.get("longitude")),
                    "created_at": row.get("created_at"),
                    "updated_at": row.get("updated_at"),
                    "technician_id": row.get("technician_id"),
                    "technician_name": row.get("technician_name") or None,
                }
            )

        return {"users": users}
    finally:
        cursor.close()