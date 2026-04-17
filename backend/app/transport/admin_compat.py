from __future__ import annotations

import asyncio
import json

from fastapi import APIRouter, Depends, HTTPException, Query, WebSocket, WebSocketDisconnect, status

from app.core.security import get_current_user_payload
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
    status_value = "available" if is_active else "offline"
    return {
        "id": user.get("id"),
        "full_name": user.get("full_name") or "Technician",
        "email": user.get("email") or "",
        "phone_number": user.get("phone_number") or "",
        "specialties": [],
        "status": status_value,
        "location_address": "N/A",
        "latitude": 0,
        "longitude": 0,
        "current_jobs": 0,
        "completion_rate": 0,
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
            SELECT id, full_name, email, phone_number, is_active
            FROM users
            WHERE role = 'technician'
            ORDER BY is_active DESC, id DESC
            """
        )
        technicians = [_map_technician(row) for row in cursor.fetchall()]
        return {"technicians": technicians}
    finally:
        cursor.close()


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
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    _require_admin(current_user)
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
            SELECT DATE(created_at) AS day, COALESCE(SUM(final_price), 0) AS revenue
            FROM bookings
            WHERE status = 'completed' AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 DAY)
            GROUP BY DATE(created_at)
            ORDER BY day ASC
            """
        )
        daily_rows = cursor.fetchall()
    finally:
        cursor.close()

    daily_revenue = [
        {"date": str(item.get("day")), "revenue": float(item.get("revenue") or 0)}
        for item in daily_rows
    ]

    return {
        "stats": {
            "total_revenue": float(totals.get("total_revenue") or 0),
            "pending_revenue": float(totals.get("pending_revenue") or 0),
            "daily_revenue": daily_revenue,
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
