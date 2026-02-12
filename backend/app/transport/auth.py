from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from app.database import get_db_connection
from app.model.auth_model import UserRegister, UserLogin, Token
from app.logic import user_logic
from app.core.security import verify_password, create_access_token
from datetime import timedelta
from app.core.config import settings

router = APIRouter()

@router.post("/register", response_model=dict, status_code=201)
def register(user: UserRegister, db = Depends(get_db_connection)):
    # 1. Check if email already exists
    existing_user = user_logic.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # 2. Create new user
    try:
        user_id = user_logic.create_user(db, user)
        return {"message": "User registered successfully", "user_id": user_id}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/login", response_model=Token)
def login(form_data: UserLogin, db = Depends(get_db_connection)):
    # 1. Fetch user
    user = user_logic.get_user_by_email(db, form_data.email)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # 2. Verify Password
    if not verify_password(form_data.password, user['password_hash']):
        raise HTTPException(status_code=400, detail="Incorrect email or password")
    
    # 3. Check if active
    if not user['is_active']:
        raise HTTPException(status_code=400, detail="User account is inactive")

    # 4. Generate Token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user['email'], "id": user['id'], "role": user['role']},
        expires_delta=access_token_expires
    )
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user['id'],
        "role": user['role'],
        "full_name": user['full_name']
    }