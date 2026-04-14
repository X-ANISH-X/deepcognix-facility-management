from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_payload
from app.database import get_db_connection
from app.logic import service_logic
from app.model.service_model import ServiceCreate

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)

@router.post("/")
def create_service(
    service: ServiceCreate,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create services",
        )
    try:
        service_id = service_logic.create_service(db, service)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc
    return {
        "message": "Service created successfully",
        "service_id": service_id
    }

@router.get("/")
def list_services(db=Depends(get_db_connection)):
    return service_logic.get_all_services(db)

@router.get("/category/{category_id}")
def list_services_by_category(category_id: int, db=Depends(get_db_connection)):
    return service_logic.get_services_by_category(db, category_id)


@router.put("/{service_id}")
def update_service(
    service_id: int,
    service: ServiceCreate,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update services",
        )
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id FROM services WHERE id = %s", (service_id,))
        if not cursor.fetchone():
            raise HTTPException(status_code=404, detail="Service not found")
        cursor.execute(
            """
            UPDATE services
            SET category_id = %s, name = %s, description = %s, base_price = %s, duration_minutes = %s
            WHERE id = %s
            """,
            (service.category_id, service.name, service.description, service.base_price, service.duration_minutes, service_id),
        )
        db.commit()
        cursor.execute("SELECT * FROM services WHERE id = %s", (service_id,))
        return cursor.fetchone()
    finally:
        cursor.close()


@router.patch("/{service_id}/toggle-active")
def toggle_service_active(
    service_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can update services",
        )
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, is_active FROM services WHERE id = %s", (service_id,))
        svc = cursor.fetchone()
        if not svc:
            raise HTTPException(status_code=404, detail="Service not found")
        new_status = not svc["is_active"]
        cursor.execute("UPDATE services SET is_active = %s WHERE id = %s", (new_status, service_id))
        db.commit()
        return {"service_id": service_id, "is_active": new_status}
    finally:
        cursor.close()
