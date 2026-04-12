from fastapi import APIRouter, Depends, HTTPException

from app.core.security import get_current_user_payload
from app.database import get_db_connection
from app.logic import notification_logic

router = APIRouter(prefix="/notifications", tags=["Notifications"])


@router.get("/", response_model=list[dict])
def list_my_notifications(
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    return notification_logic.list_notifications(conn, current_user["id"])


@router.patch("/{notification_id}/read")
def mark_notification_read(
    notification_id: int,
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    updated = notification_logic.mark_notification_read(conn, current_user["id"], notification_id)
    if not updated:
        raise HTTPException(status_code=404, detail="Notification not found")
    return {"message": "Notification marked as read"}


@router.patch("/read-all")
def mark_all_notifications_read(
    conn=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    notification_logic.mark_all_notifications_read(conn, current_user["id"])
    return {"message": "Notifications marked as read"}
