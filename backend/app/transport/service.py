from fastapi import APIRouter, Depends
from app.database import get_db_connection
from app.model.service_model import ServiceCreate
from app.logic import service_logic

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)

@router.post("/")
def create_service(service: ServiceCreate, db=Depends(get_db_connection)):
    service_id = service_logic.create_service(db, service)
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
