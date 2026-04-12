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
