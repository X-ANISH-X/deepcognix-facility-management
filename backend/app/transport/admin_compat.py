from __future__ import annotations

import asyncio
import json
from datetime import date, timedelta

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import get_current_user_payload, get_password_hash
from app.database import get_db_connection
from app.logic import booking_logic, category_logic, notification_logic, package_logic

router = APIRouter(tags=["Admin Compatibility"])


class _RealtimeHub:
    def __init__(self):
        self._clients: set[WebSocket] = set()
        self._loop: asyncio.AbstractEventLoop | None = None

    async def connect(self, websocket: WebSocket):
        await websocket.accept()
        self._clients.add(websocket)
        if self._loop is None:
            self._loop = asyncio.get_running_loop()

    async def disconnect(self, websocket: WebSocket):
        self._clients.discard(websocket)

    async def broadcast(self, payload: dict):
        if not self._clients:
            return

        text = json.dumps(payload)
        stale: list[WebSocket] = []
        for client in list(self._clients):
            try:
                await client.send_text(text)
            except Exception:
                stale.append(client)

        for client in stale:
            self._clients.discard(client)

    def publish(self, payload: dict):
        if not self._loop or not self._clients:
            return
        self._loop.call_soon_threadsafe(asyncio.create_task, self.broadcast(payload))


_realtime_hub = _RealtimeHub()


def _publish_event(event: str, **payload):
    _realtime_hub.publish({"event": event, **payload})


def _require_admin(current_user: dict):
    if current_user.get("role") != "admin":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Admin access required")


def _map_technician(user: dict) -> dict:
    is_active = bool(user.get("is_active", True))
    latest_booking_status = str(user.get("latest_booking_status") or "").strip().lower()

    if not is_active:
        status_value = "offline"
    elif latest_booking_status in {"in_progress"}:
        status_value = "onsite"
    elif latest_booking_status in {"assigned", "completion_requested", "approved"}:
        status_value = "assigned"
    else:
        status_value = "available"

    completion_rate = user.get("completion_rate")
    try:
        completion_rate_value = float(completion_rate) if completion_rate is not None else 0.0
    except (TypeError, ValueError):
        completion_rate_value = 0.0

    current_jobs = user.get("current_jobs")
    try:
        current_jobs_value = int(current_jobs) if current_jobs is not None else 0
    except (TypeError, ValueError):
        current_jobs_value = 0

    latitude = user.get("live_latitude")
    if latitude is None:
        latitude = user.get("booking_latitude")
    longitude = user.get("live_longitude")
    if longitude is None:
        longitude = user.get("booking_longitude")

    try:
        latitude_value = float(latitude) if latitude is not None else 0.0
    except (TypeError, ValueError):
        latitude_value = 0.0

    try:
        longitude_value = float(longitude) if longitude is not None else 0.0
    except (TypeError, ValueError):
        longitude_value = 0.0

    location_address = user.get("location_address") or user.get("booking_address") or "N/A"

    return {
        "id": user.get("id"),
        "full_name": user.get("full_name") or "Technician",
        "email": user.get("email") or "",
        "phone_number": user.get("phone_number") or "",
        "specialties": [],
        "status": status_value,
        "location_address": str(location_address),
        "latitude": latitude_value,
        "longitude": longitude_value,
        "current_jobs": current_jobs_value,
        "completion_rate": completion_rate_value,
        "is_active": is_active,
    }


def _coerce_booking_status(raw_status: str) -> str:
    allowed = {
        "submitted",
        "approved",
        "assigned",
        "in_progress",
        "completion_requested",
        "completed",
        "rejection_requested",
        "rejected",
    }
    if raw_status not in allowed:
        raise HTTPException(status_code=400, detail=f"Invalid status '{raw_status}'")
    return raw_status


def _ensure_service_package_meta_table(db):
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            CREATE TABLE IF NOT EXISTS service_package_meta (
                package_id INT PRIMARY KEY,
                service_ids_json LONGTEXT NOT NULL,
                estimated_times_json LONGTEXT NOT NULL,
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
            )
            """
        )
        db.commit()
    finally:
        cursor.close()


def _normalize_service_ids(raw: object) -> list[int]:
    if not isinstance(raw, list):
        return []
    normalized: list[int] = []
    for item in raw:
        try:
            value = int(item)
        except (TypeError, ValueError):
            continue
        if value > 0 and value not in normalized:
            normalized.append(value)
    return normalized


def _normalize_estimated_times(raw: object) -> dict[str, str]:
    if not isinstance(raw, dict):
        return {}
    output: dict[str, str] = {}
    for key, value in raw.items():
        k = str(key).strip()
        v = str(value).strip()
        if k and v:
            output[k] = v
    return output


def _validate_service_ids(db, service_ids: list[int]):
    if not service_ids:
        return

    placeholders = ",".join(["%s"] * len(service_ids))
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            f"SELECT id FROM services WHERE id IN ({placeholders}) AND is_active = TRUE",
            tuple(service_ids),
        )
        found = {int(row["id"]) for row in cursor.fetchall()}
    finally:
        cursor.close()

    missing = [sid for sid in service_ids if sid not in found]
    if missing:
        raise HTTPException(status_code=400, detail=f"Invalid or inactive service IDs: {missing}")


def _calculate_price_from_services(db, service_ids: list[int]) -> float:
    if not service_ids:
        return 0.0

    placeholders = ",".join(["%s"] * len(service_ids))
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            f"SELECT COALESCE(SUM(base_price), 0) AS total_price FROM services WHERE id IN ({placeholders})",
            tuple(service_ids),
        )
        row = cursor.fetchone() or {"total_price": 0}
        return float(row.get("total_price") or 0)
    finally:
        cursor.close()


def _normalize_revenue_period(period: str | None) -> str:
    allowed_periods = {"day", "week", "month", "year"}
    normalized = (period or "week").strip().lower()
    return normalized if normalized in allowed_periods else "week"


def _build_revenue_trend_rows(period: str, rows: list[dict]) -> list[dict]:
    revenue_by_bucket: dict[str, float] = {}
    for row in rows:
        bucket_key = str(row.get("bucket") or row.get("day") or row.get("month") or row.get("hour") or "")
        if bucket_key:
            revenue_by_bucket[bucket_key] = float(row.get("revenue") or 0)

    today = date.today()

    if period == "day":
        return [
            {
                "label": f"{hour:02d}:00",
                "revenue": revenue_by_bucket.get(str(hour), 0.0),
            }
            for hour in range(8, 18)
        ]

    if period == "week":
        start_day = today - timedelta(days=6)
        return [
            {
                "label": (start_day + timedelta(days=offset)).strftime("%a"),
                "revenue": revenue_by_bucket.get((start_day + timedelta(days=offset)).isoformat(), 0.0),
            }
            for offset in range(7)
        ]

    if period == "month":
        return [
            {
                "label": f"Week {week_number}",
                "revenue": revenue_by_bucket.get(str(week_number), 0.0),
            }
            for week_number in range(1, 6)
        ]

    return [
        {
            "label": month_name,
            "revenue": revenue_by_bucket.get(str(index), 0.0),
        }
        for index, month_name in enumerate(
            [
                "Jan",
                "Feb",
                "Mar",
                "Apr",
                "May",
                "Jun",
                "Jul",
                "Aug",
                "Sep",
                "Oct",
                "Nov",
                "Dec",
            ],
            start=1,
        )
    ]


def _upsert_service_package_meta(db, package_id: int, service_ids: list[int], estimated_times: dict[str, str]):
    _ensure_service_package_meta_table(db)
    cursor = db.cursor()
    try:
        cursor.execute(
            """
            INSERT INTO service_package_meta (package_id, service_ids_json, estimated_times_json)
            VALUES (%s, %s, %s)
            ON DUPLICATE KEY UPDATE
                service_ids_json = VALUES(service_ids_json),
                estimated_times_json = VALUES(estimated_times_json)
            """,
            (package_id, json.dumps(service_ids), json.dumps(estimated_times)),
        )
        db.commit()
    finally:
        cursor.close()


def _read_service_package_meta_map(db, package_ids: list[int]) -> dict[int, dict]:
    if not package_ids:
        return {}

    _ensure_service_package_meta_table(db)
    placeholders = ",".join(["%s"] * len(package_ids))
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            f"SELECT package_id, service_ids_json, estimated_times_json FROM service_package_meta WHERE package_id IN ({placeholders})",
            tuple(package_ids),
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()

    output: dict[int, dict] = {}
    for row in rows:
        package_id = int(row.get("package_id") or 0)
        try:
            service_ids = json.loads(row.get("service_ids_json") or "[]")
        except json.JSONDecodeError:
            service_ids = []
        try:
            estimated_times = json.loads(row.get("estimated_times_json") or "{}")
        except json.JSONDecodeError:
            estimated_times = {}

        output[package_id] = {
            "service_ids": _normalize_service_ids(service_ids),
            "estimated_times": _normalize_estimated_times(estimated_times),
        }

    return output


@router.get("/services/categories/all")
def list_categories_alias(db=Depends(get_db_connection)):
    categories = category_logic.get_all_categories(db)
    return {"categories": categories}


@router.post("/services/categories")
def create_category_alias(
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    name = str(payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Category name is required")

    icon_url = payload.get("icon_url")
    category_id = category_logic.create_category(db, type("Category", (), {"name": name, "icon_url": icon_url}))
    _publish_event("service.category.updated", category_id=category_id)
    return {"id": category_id, "name": name, "icon_url": icon_url, "is_active": True}


@router.get("/technicians")
def list_technicians(
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
                      AND b.status IN ('assigned', 'in_progress', 'completion_requested')
                ) AS current_jobs,
                (
                    SELECT b.status
                    FROM bookings b
                    WHERE b.technician_id = u.id
                    ORDER BY b.updated_at DESC, b.id DESC
                    LIMIT 1
                ) AS latest_booking_status,
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
                    SELECT
                        CASE
                            WHEN COUNT(*) = 0 THEN 0
                            ELSE ROUND(SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) * 100.0 / COUNT(*), 1)
                        END
                    FROM bookings b
                    WHERE b.technician_id = u.id
                ) AS completion_rate,
                (
                    SELECT COALESCE(MAX(ll.recorded_at), NULL)
                    FROM technician_live_locations ll
                    WHERE ll.technician_id = u.id
                ) AS location_recorded_at,
                COALESCE(
                    (
                        SELECT b.address_line
                        FROM bookings b
                        WHERE b.technician_id = u.id
                        ORDER BY b.updated_at DESC, b.id DESC
                        LIMIT 1
                    ),
                    'N/A'
                ) AS location_address
            FROM users u
            WHERE u.role = 'technician'
            ORDER BY u.is_active DESC, u.id DESC
            """
        )
        technicians = [_map_technician(row) for row in cursor.fetchall()]
        return {"technicians": technicians}
    finally:
        cursor.close()


@router.post("/technicians", status_code=201)
def create_technician(
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    full_name = str(payload.get("full_name") or "").strip()
    email = str(payload.get("email") or "").strip().lower()
    password = str(payload.get("password") or "")
    phone_number = str(payload.get("phone_number") or "").strip()

    if not full_name:
        raise HTTPException(status_code=400, detail="Technician full_name is required")
    if not email:
        raise HTTPException(status_code=400, detail="Technician email is required")
    if len(password) < 6:
        raise HTTPException(status_code=400, detail="Password must be at least 6 characters")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM users WHERE email = %s", (email,))
        if cursor.fetchone():
            raise HTTPException(status_code=400, detail="Email already registered")

        cursor.execute(
            """
            INSERT INTO users (full_name, email, password_hash, phone_number, role, is_active)
            VALUES (%s, %s, %s, %s, 'technician', TRUE)
            """,
            (full_name, email, get_password_hash(password), phone_number or None),
        )
        technician_id = int(cursor.lastrowid)
        db.commit()

        cursor.execute(
            """
            SELECT id, full_name, email, phone_number, is_active
            FROM users
            WHERE id = %s AND role = 'technician'
            """,
            (technician_id,),
        )
        created = cursor.fetchone()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        cursor.close()

    _publish_event("technician.updated", technician_id=technician_id, action="created")
    return {"technician": _map_technician(created or {"id": technician_id, "full_name": full_name, "email": email})}


@router.delete("/technicians/{technician_id}")
def deactivate_technician(
    technician_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, role, is_active FROM users WHERE id = %s",
            (technician_id,),
        )
        row = cursor.fetchone()
        if not row or row.get("role") != "technician":
            raise HTTPException(status_code=404, detail="Technician not found")

        if not bool(row.get("is_active", True)):
            return {"message": "Technician already inactive", "technician_id": technician_id, "is_active": False}

        cursor.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (technician_id,))
        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        cursor.close()

    _publish_event("technician.updated", technician_id=technician_id, action="deactivated")
    return {"message": "Technician deactivated", "technician_id": technician_id, "is_active": False}


@router.get("/customers/previous")
def list_previous_customers(
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
                stats.total_bookings,
                stats.completed_bookings,
                stats.total_spent,
                stats.first_booking_at,
                stats.last_booking_at
            FROM users u
            INNER JOIN (
                SELECT
                    b.customer_id,
                    COUNT(*) AS total_bookings,
                    SUM(CASE WHEN b.status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
                    COALESCE(SUM(CASE WHEN b.status = 'completed' THEN b.final_price ELSE 0 END), 0) AS total_spent,
                    MIN(b.created_at) AS first_booking_at,
                    MAX(COALESCE(b.updated_at, b.created_at)) AS last_booking_at
                FROM bookings b
                GROUP BY b.customer_id
            ) stats ON stats.customer_id = u.id
            WHERE u.role = 'customer'
            ORDER BY stats.last_booking_at DESC, u.id DESC
            """
        )
        rows = cursor.fetchall()
    finally:
        cursor.close()

    customers = [
        {
            "id": row.get("id"),
            "full_name": row.get("full_name") or "",
            "email": row.get("email") or "",
            "phone_number": row.get("phone_number") or "",
            "total_bookings": int(row.get("total_bookings") or 0),
            "completed_bookings": int(row.get("completed_bookings") or 0),
            "total_spent": float(row.get("total_spent") or 0),
            "first_booking_at": str(row.get("first_booking_at") or ""),
            "last_booking_at": str(row.get("last_booking_at") or ""),
        }
        for row in rows
    ]

    return {"customers": customers}


@router.post("/notifications/admin/send")
def admin_send_customer_notification(
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    title = str(payload.get("title") or "Admin Update").strip()
    message = str(payload.get("message") or "").strip()
    raw_customer_ids = payload.get("customer_ids")

    if not message:
        raise HTTPException(status_code=400, detail="Notification message is required")

    customer_ids: list[int] = []
    if isinstance(raw_customer_ids, list):
        for value in raw_customer_ids:
            try:
                parsed = int(value)
            except (TypeError, ValueError):
                continue
            if parsed > 0 and parsed not in customer_ids:
                customer_ids.append(parsed)

    cursor = db.cursor(dictionary=True)
    try:
        if customer_ids:
            placeholders = ",".join(["%s"] * len(customer_ids))
            cursor.execute(
                f"""
                SELECT id
                FROM users
                WHERE role = 'customer' AND is_active = TRUE AND id IN ({placeholders})
                """,
                tuple(customer_ids),
            )
        else:
            cursor.execute(
                """
                SELECT id
                FROM users
                WHERE role = 'customer' AND is_active = TRUE
                """
            )

        recipients = [int(row.get("id") or 0) for row in cursor.fetchall() if int(row.get("id") or 0) > 0]

        if not recipients:
            raise HTTPException(status_code=404, detail="No customer recipients found")

        for customer_id in recipients:
            notification_logic.create_notification(
                cursor,
                user_id=customer_id,
                title=title,
                message=message,
                notification_type="admin_broadcast",
            )

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        cursor.close()

    _publish_event("notification.broadcast", sent_count=len(recipients))
    return {"message": "Notification sent", "sent_count": len(recipients)}


@router.post("/support/contact")
def contact_support(
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user.get("role") != "customer":
        raise HTTPException(status_code=403, detail="Customer access required")

    subject = str(payload.get("subject") or "Customer Support").strip()
    message = str(payload.get("message") or "").strip()
    contact_name = str(payload.get("name") or "").strip()
    contact_email = str(payload.get("email") or "").strip()
    contact_phone = str(payload.get("phone") or "").strip()

    if not message:
        raise HTTPException(status_code=400, detail="Support message is required")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT full_name, email, phone_number FROM users WHERE id = %s AND role = 'customer'",
            (current_user["id"],),
        )
        customer = cursor.fetchone() or {}

        customer_name = contact_name or str(customer.get("full_name") or "Customer")
        customer_email = contact_email or str(customer.get("email") or current_user.get("email") or "")
        customer_phone = contact_phone or str(customer.get("phone_number") or "")

        cursor.execute(
            "SELECT id FROM users WHERE role = 'admin' AND is_active = TRUE"
        )
        admin_rows = cursor.fetchall()
        admin_ids = [int(row.get("id") or 0) for row in admin_rows if int(row.get("id") or 0) > 0]

        if not admin_ids:
            raise HTTPException(status_code=404, detail="No admin recipients found")

        notification_message = (
            f"Support request from {customer_name}"
            + (f" ({customer_email})" if customer_email else "")
            + (f" | Phone: {customer_phone}" if customer_phone else "")
            + f"\nSubject: {subject}\nMessage: {message}"
        )

        for admin_id in admin_ids:
            notification_logic.create_notification(
                cursor,
                user_id=admin_id,
                title=f"Support Request - {subject}",
                message=notification_message,
                notification_type="support_contact",
            )

        db.commit()
    except HTTPException:
        db.rollback()
        raise
    except Exception:
        db.rollback()
        raise
    finally:
        cursor.close()

    _publish_event("notification.support_contact", sent_count=len(admin_ids))
    return {"message": "Support request sent", "sent_count": len(admin_ids)}


@router.get("/technicians/{technician_id}")
def get_technician(
    technician_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, full_name, email, phone_number, is_active
            FROM users
            WHERE id = %s AND role = 'technician'
            """,
            (technician_id,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Technician not found")
        return {"technician": _map_technician(row)}
    finally:
        cursor.close()


@router.put("/technicians/{technician_id}/profile")
def update_technician_profile_alias(
    technician_id: int,
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT id, full_name, email, phone_number, is_active FROM users WHERE id = %s AND role = 'technician'",
            (technician_id,),
        )
        row = cursor.fetchone()
        if not row:
            raise HTTPException(status_code=404, detail="Technician not found")

        requested_status = payload.get("status")
        if isinstance(requested_status, str):
            normalized = requested_status.strip().lower()
            if normalized == "offline":
                cursor.execute("UPDATE users SET is_active = FALSE WHERE id = %s", (technician_id,))
                db.commit()
                row["is_active"] = False
            elif normalized in {"available", "assigned", "enroute", "onsite"}:
                cursor.execute("UPDATE users SET is_active = TRUE WHERE id = %s", (technician_id,))
                db.commit()
                row["is_active"] = True

        _publish_event("technician.updated", technician_id=technician_id)
        return {"profile": _map_technician(row)}
    finally:
        cursor.close()


@router.get("/customers/previous")
def get_previous_customers(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    cursor = db.cursor(dictionary=True)
    try:
        # Query customers who have made at least one booking, ordered by most recent booking
        cursor.execute(
            """
            SELECT DISTINCT
                u.id,
                u.full_name,
                u.email,
                u.phone_number,
                MAX(b.created_at) AS last_booking_at,
                COUNT(b.id) AS total_bookings
            FROM users u
            JOIN bookings b ON u.id = b.customer_id
            WHERE u.role = 'customer' AND u.is_active = TRUE
            GROUP BY u.id, u.full_name, u.email, u.phone_number
            ORDER BY MAX(b.created_at) DESC
            """
        )
        customers = cursor.fetchall()
        return {"customers": customers or []}
    finally:
        cursor.close()


@router.get("/notifications/unread")
def unread_notifications_alias(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "SELECT COUNT(*) AS unread_count FROM notifications WHERE user_id = %s AND is_read = FALSE",
            (current_user["id"],),
        )
        row = cursor.fetchone() or {"unread_count": 0}
        return {"unread_count": int(row.get("unread_count", 0))}
    finally:
        cursor.close()


@router.put("/notifications/{notification_id}/read")
def mark_notification_read_put_alias(
    notification_id: int,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    updated = notification_logic.mark_notification_read(conn, current_user["id"], notification_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.put("/notifications/read-all")
def mark_all_notifications_read_put_alias(
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    notification_logic.mark_all_notifications_read(conn, current_user["id"])
    return {"message": "Notifications marked as read"}


@router.get("/bookings/stats/dashboard")
def dashboard_stats_alias(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    role = current_user["role"]
    user_id = current_user["id"]

    where_clause = ""
    params: tuple = ()

    if role == "customer":
        where_clause = "WHERE customer_id = %s"
        params = (user_id,)
    elif role == "technician":
        where_clause = "WHERE technician_id = %s"
        params = (user_id,)

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            f"""
            SELECT
                COUNT(*) AS total_bookings,
                SUM(CASE WHEN status IN ('submitted', 'approved', 'assigned', 'in_progress', 'completion_requested', 'rejection_requested') THEN 1 ELSE 0 END) AS active_bookings,
                SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) AS completed_bookings,
                SUM(CASE WHEN status = 'completed' AND DATE(updated_at) = CURDATE() THEN 1 ELSE 0 END) AS completed_today,
                COALESCE(SUM(CASE WHEN status = 'completed' THEN final_price ELSE 0 END), 0) AS total_revenue
            FROM bookings
            {where_clause}
            """,
            params,
        )
        row = cursor.fetchone() or {}
    finally:
        cursor.close()

    total = int(row.get("total_bookings") or 0)
    completed = int(row.get("completed_bookings") or 0)
    completion_rate = round((completed / total) * 100, 2) if total else 0

    return {
        "stats": {
            "active_bookings": int(row.get("active_bookings") or 0),
            "completed_today": int(row.get("completed_today") or 0),
            "total_revenue": float(row.get("total_revenue") or 0),
            "completion_rate": completion_rate,
        }
    }


@router.put("/bookings/{booking_id}/assign")
def assign_booking_put_alias(
    booking_id: int,
    technician_id: int = Query(..., ge=1),
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)

    success, error = booking_logic.assign_booking(db, booking_id, technician_id)
    if not success:
        raise HTTPException(status_code=400, detail=error)

    booking = booking_logic.get_booking_by_id(db, booking_id)
    _publish_event("booking.updated", booking_id=booking_id, action="assigned")
    return {"booking": booking}


@router.put("/bookings/{booking_id}/status")
def update_booking_status_alias(
    booking_id: int,
    status: str = Query(...),
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    next_status = _coerce_booking_status(status)

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM bookings WHERE id = %s", (booking_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Booking not found")

        cursor.execute("UPDATE bookings SET status = %s WHERE id = %s", (next_status, booking_id))
        db.commit()
    finally:
        cursor.close()

    booking = booking_logic.get_booking_by_id(db, booking_id)
    _publish_event("booking.updated", booking_id=booking_id, action="status", status=next_status)
    return {"booking": booking}


@router.get("/services/{service_id}")
def get_service_alias(
    service_id: int,
    db=Depends(get_db_connection),
):
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT id, category_id, name, description, base_price, duration_minutes, is_active
            FROM services
            WHERE id = %s
            """,
            (service_id,),
        )
        service = cursor.fetchone()
        if not service:
            raise HTTPException(status_code=404, detail="Service not found")
        return service
    finally:
        cursor.close()


@router.delete("/services/{service_id}")
def delete_service_alias(
    service_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM services WHERE id = %s", (service_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Service not found")
        cursor.execute("UPDATE services SET is_active = FALSE WHERE id = %s", (service_id,))
        db.commit()
        _publish_event("service.updated", service_id=service_id, action="deactivated")
        return {"message": "Service deactivated", "service_id": service_id}
    finally:
        cursor.close()


@router.get("/payments/stats/revenue")
def revenue_stats_alias(
    period: str = Query("week"),
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    normalized_period = _normalize_revenue_period(period)
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            """
            SELECT
                COALESCE(SUM(CASE WHEN status = 'completed' THEN final_price ELSE 0 END), 0) AS total_revenue,
                COALESCE(SUM(CASE WHEN status IN ('submitted','approved','assigned','in_progress','completion_requested','rejection_requested') THEN final_price ELSE 0 END), 0) AS pending_revenue
            FROM bookings
            """
        )
        totals = cursor.fetchone() or {}

        cursor.execute(
            """
            SELECT DATE(updated_at) AS day, COALESCE(SUM(final_price), 0) AS revenue
            FROM bookings
            WHERE status = 'completed' AND DATE(updated_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(updated_at)
            ORDER BY day ASC
            """
        )
        daily_rows = cursor.fetchall()

        if normalized_period == "day":
            cursor.execute(
                """
                SELECT HOUR(updated_at) AS bucket, COALESCE(SUM(final_price), 0) AS revenue
                FROM bookings
                WHERE status = 'completed'
                  AND DATE(updated_at) = CURDATE()
                  AND HOUR(updated_at) BETWEEN 8 AND 17
                GROUP BY HOUR(updated_at)
                ORDER BY bucket ASC
                """
            )
            trend_rows = cursor.fetchall()
        elif normalized_period == "week":
            cursor.execute(
                """
                SELECT DATE(updated_at) AS bucket, COALESCE(SUM(final_price), 0) AS revenue
                FROM bookings
                WHERE status = 'completed' AND DATE(updated_at) >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
                GROUP BY DATE(updated_at)
                ORDER BY bucket ASC
                """
            )
            trend_rows = cursor.fetchall()
        elif normalized_period == "month":
            cursor.execute(
                """
                SELECT FLOOR((DAY(updated_at) - 1) / 7) + 1 AS bucket, COALESCE(SUM(final_price), 0) AS revenue
                FROM bookings
                WHERE status = 'completed'
                  AND YEAR(updated_at) = YEAR(CURDATE())
                  AND MONTH(updated_at) = MONTH(CURDATE())
                GROUP BY FLOOR((DAY(updated_at) - 1) / 7) + 1
                ORDER BY bucket ASC
                """
            )
            trend_rows = cursor.fetchall()
        else:
            cursor.execute(
                """
                SELECT MONTH(updated_at) AS bucket, COALESCE(SUM(final_price), 0) AS revenue
                FROM bookings
                WHERE status = 'completed' AND YEAR(updated_at) = YEAR(CURDATE())
                GROUP BY MONTH(updated_at)
                ORDER BY bucket ASC
                """
            )
            trend_rows = cursor.fetchall()
    finally:
        cursor.close()

    daily_revenue = [
        {"date": str(item.get("day")), "revenue": float(item.get("revenue") or 0)}
        for item in daily_rows
    ]

    trend_data = _build_revenue_trend_rows(normalized_period, trend_rows)

    return {
        "stats": {
            "total_revenue": float(totals.get("total_revenue") or 0),
            "pending_revenue": float(totals.get("pending_revenue") or 0),
            "daily_revenue": daily_revenue,
            "trend_data": trend_data,
            "trend_period": normalized_period,
        }
    }


def _map_package_to_service_package(item: dict, meta: dict | None = None) -> dict:
    meta = meta or {}
    return {
        "id": item.get("id"),
        "name": item.get("name"),
        "description": item.get("description") or "",
        "service_ids": _normalize_service_ids(meta.get("service_ids", [])),
        "estimated_times": _normalize_estimated_times(meta.get("estimated_times", {})),
        "is_active": bool(item.get("is_active", True)),
    }


@router.get("/service-packages/")
def list_service_packages_alias(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    packages = package_logic.list_packages(db)
    package_ids = [int(item.get("id") or 0) for item in packages]
    meta_map = _read_service_package_meta_map(db, package_ids)
    return [_map_package_to_service_package(item, meta_map.get(int(item.get("id") or 0))) for item in packages]


@router.post("/service-packages/")
def create_service_package_alias(
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    name = str(payload.get("name") or "").strip()
    if not name:
        raise HTTPException(status_code=400, detail="Package name is required")

    description = str(payload.get("description") or "").strip()
    service_ids = _normalize_service_ids(payload.get("service_ids", []))
    estimated_times = _normalize_estimated_times(payload.get("estimated_times", {}))
    _validate_service_ids(db, service_ids)

    raw_price = payload.get("price")
    if raw_price is None:
        price = _calculate_price_from_services(db, service_ids)
    else:
        try:
            price = float(raw_price)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid package price")

    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute(
            "INSERT INTO packages (name, price, description, is_active) VALUES (%s, %s, %s, TRUE)",
            (name, price, description),
        )
        package_id = cursor.lastrowid
        db.commit()
    finally:
        cursor.close()

    _upsert_service_package_meta(db, int(package_id), service_ids, estimated_times)
    package = package_logic.get_package_by_id(db, int(package_id))
    _publish_event("service-package.updated", package_id=int(package_id), action="created")
    return _map_package_to_service_package(package, {"service_ids": service_ids, "estimated_times": estimated_times})


@router.put("/service-packages/{package_id}")
def update_service_package_alias(
    package_id: int,
    payload: dict,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    existing = package_logic.get_package_by_id(db, package_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Package not found")

    next_name = str(payload.get("name") or existing.get("name") or "").strip()
    if not next_name:
        raise HTTPException(status_code=400, detail="Package name is required")

    next_description = str(payload.get("description") if payload.get("description") is not None else existing.get("description") or "").strip()
    next_is_active = payload.get("is_active")
    if next_is_active is None:
        next_is_active = payload.get("isActive")
    if next_is_active is None:
        next_is_active = bool(existing.get("is_active", True))
    next_is_active = bool(next_is_active)

    incoming_service_ids = payload.get("service_ids")
    if incoming_service_ids is None:
        incoming_service_ids = payload.get("serviceIds")
    incoming_estimated_times = payload.get("estimated_times")
    if incoming_estimated_times is None:
        incoming_estimated_times = payload.get("estimatedTimes")

    meta_map = _read_service_package_meta_map(db, [package_id])
    existing_meta = meta_map.get(package_id, {"service_ids": [], "estimated_times": {}})
    next_service_ids = _normalize_service_ids(
        existing_meta.get("service_ids", []) if incoming_service_ids is None else incoming_service_ids
    )
    next_estimated_times = _normalize_estimated_times(
        existing_meta.get("estimated_times", {}) if incoming_estimated_times is None else incoming_estimated_times
    )
    _validate_service_ids(db, next_service_ids)

    raw_price = payload.get("price")
    if raw_price is None:
        next_price = _calculate_price_from_services(db, next_service_ids) if next_service_ids else float(existing.get("price") or 0)
    else:
        try:
            next_price = float(raw_price)
        except (TypeError, ValueError):
            raise HTTPException(status_code=400, detail="Invalid package price")

    cursor = db.cursor()
    try:
        cursor.execute(
            "UPDATE packages SET name = %s, description = %s, price = %s, is_active = %s WHERE id = %s",
            (next_name, next_description, next_price, next_is_active, package_id),
        )
        db.commit()
    finally:
        cursor.close()

    _upsert_service_package_meta(db, package_id, next_service_ids, next_estimated_times)
    package = package_logic.get_package_by_id(db, package_id)
    _publish_event("service-package.updated", package_id=package_id, action="updated")
    return _map_package_to_service_package(package, {"service_ids": next_service_ids, "estimated_times": next_estimated_times})


@router.delete("/service-packages/{package_id}")
def delete_service_package_alias(
    package_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
    existing = package_logic.get_package_by_id(db, package_id)
    if not existing:
        raise HTTPException(status_code=404, detail="Package not found")

    cursor = db.cursor()
    try:
        cursor.execute("UPDATE packages SET is_active = FALSE WHERE id = %s", (package_id,))
        db.commit()
    finally:
        cursor.close()

    _publish_event("service-package.updated", package_id=package_id, action="deleted")
    return {"message": "Service package deleted", "id": package_id}


@router.websocket("/realtime/ws")
async def realtime_ws_compat(websocket: WebSocket):
    await _realtime_hub.connect(websocket)
    await websocket.send_text('{"event":"realtime.connected","status":"ok"}')
    try:
        while True:
            message = await websocket.receive_text()
            if message.lower() == "ping":
                await websocket.send_text('{"event":"heartbeat","status":"ok"}')
    except WebSocketDisconnect:
        await _realtime_hub.disconnect(websocket)
        return
