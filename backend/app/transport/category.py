from fastapi import APIRouter, Depends, HTTPException, status

from app.core.security import get_current_user_payload
from app.database import get_db_connection
from app.logic import category_logic
from app.model.category_model import CategoryCreate

router = APIRouter(
    prefix="/categories",
    tags=["Categories"]
)

@router.post("/")
def create_category(
    category: CategoryCreate,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    if current_user["role"] != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only admins can create categories",
        )
    category_id = category_logic.create_category(db, category)
    return {
        "message": "Category created successfully",
        "category_id": category_id
    }

@router.get("/")
def list_categories(db=Depends(get_db_connection)):
    return category_logic.get_all_categories(db)
