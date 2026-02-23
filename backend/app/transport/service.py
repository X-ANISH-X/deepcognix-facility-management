from fastapi import APIRouter, Depends
from app.database import get_db_connection
from app.model.service_model import ServiceCreate
from app.logic import service_logic

router = APIRouter(
    prefix="/services",
    tags=["Services"]
)

# CREATE SERVICE
@router.post("/")
def create_service(service: ServiceCreate, db=Depends(get_db_connection)):
    service_id = service_logic.create_service(db, service)
    return {
        "message": "Service created successfully",
        "service_id": service_id
    }


# 🔥 THIS IS THE IMPORTANT CHANGE
# LIST ALL SERVICES (SEND TRANSLATION KEYS)
@router.get("/")
def list_services(db=Depends(get_db_connection)):
    services = service_logic.get_all_services(db)

    return [
        {
            "id": service.id,
            "title": f"service_{service.id}",
            "subtitle": f"service_{service.id}_desc"
        }
        for service in services
    ]


# LIST BY CATEGORY
@router.get("/category/{category_id}")
def list_services_by_category(category_id: int, db=Depends(get_db_connection)):
    services = service_logic.get_services_by_category(db, category_id)

    return [
        {
            "id": service.id,
            "title": f"service_{service.id}",
            "subtitle": f"service_{service.id}_desc"
        }
        for service in services
    ]
