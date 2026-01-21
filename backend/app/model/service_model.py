from pydantic import BaseModel
from typing import Optional

class ServiceCreate(BaseModel):
    category_id: int
    name: str
    description: Optional[str] = None
    base_price: float
    duration_minutes: int = 60

class ServiceResponse(BaseModel):
    id: int
    category_id: int
    name: str
    description: Optional[str]
    base_price: float
    duration_minutes: int
    is_active: bool
