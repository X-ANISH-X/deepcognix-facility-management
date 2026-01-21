from pydantic import BaseModel
from typing import Optional

class CategoryCreate(BaseModel):
    name: str
    icon_url: Optional[str] = None

class CategoryResponse(BaseModel):
    id: int
    name: str
    icon_url: Optional[str]
    is_active: bool
