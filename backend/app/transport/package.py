from fastapi import APIRouter, Depends, HTTPException

from app.database import get_db_connection
from app.logic import package_logic

router = APIRouter(prefix="/packages", tags=["Packages"])


@router.get("/")
def list_packages(db=Depends(get_db_connection)):
    return package_logic.list_packages(db)


@router.get("/{package_id}")
def get_package(package_id: int, db=Depends(get_db_connection)):
    package = package_logic.get_package_by_id(db, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package


@router.get("/{package_id}/tasks")
def get_package_tasks(package_id: int, db=Depends(get_db_connection)):
    package = package_logic.get_package_by_id(db, package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Package not found")
    return package_logic.get_package_tasks(db, package_id)
