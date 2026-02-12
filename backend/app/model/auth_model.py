# this file is for login/register request bodies

from pydantic import BaseModel, EmailStr
from typing import Optional

# What the User sends during Registration
class UserRegister(BaseModel):
    full_name: str
    email: EmailStr
    password: str
    phone_number: str
    role: str = "customer" # Default to customer, can be 'technician' ( might need to change this, not sure if this is correct )

# What the User sends during Login
class UserLogin(BaseModel):
    email: EmailStr
    password: str

# What the API returns (The Token)
class Token(BaseModel):
    access_token: str
    token_type: str
    user_id: int
    role: str
    full_name: str