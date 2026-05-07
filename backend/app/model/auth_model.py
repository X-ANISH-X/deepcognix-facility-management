from typing import Literal

from pydantic import BaseModel, EmailStr, Field


UserRole = Literal["admin", "customer", "technician"]
SelfRegisterRole = Literal["customer", "technician"]


class UserRegister(BaseModel):
    full_name: str = Field(min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    phone_number: str | None = Field(default=None, max_length=20)
    role: UserRole = "customer"


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=1)


class Token(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str
    user_id: int
    role: UserRole
    full_name: str


class RefreshTokenRequest(BaseModel):
    refresh_token: str


class CurrentUserResponse(BaseModel):
    id: int
    full_name: str
    email: EmailStr
    phone_number: str | None = None
    role: UserRole
    is_active: bool
