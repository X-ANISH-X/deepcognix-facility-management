from fastapi import APIRouter, Depends
from app.database import get_db_connection
from app.model.category_model import CategoryCreate
from app.logic import category_logic

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.post("/")
def create_category(category: CategoryCreate, db=Depends(get_db_connection)):
    category_id = category_logic.create_category(db, category)
    return {
        "message": "Category created successfully",
        "category_id": category_id
    }

@router.get("/")
def list_categories(db=Depends(get_db_connection)):
    return category_logic.get_all_categories(db)
