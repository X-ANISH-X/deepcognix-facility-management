from datetime import timedelta

from fastapi import APIRouter, Depends, HTTPException
from fastapi.security import OAuth2PasswordRequestForm

from app.core.config import settings
from app.core.security import create_access_token, get_current_user_payload, verify_password
from app.database import get_db_connection
from app.logic import user_logic
from app.model.auth_model import CurrentUserResponse, Token, UserLogin, UserRegister

router = APIRouter()

@router.post("/register", response_model=dict, status_code=201)
def register(user: UserRegister, db = Depends(get_db_connection)):

    # 🔥 CLEAN PASSWORD (THIS IS THE FIX)
    raw_password = user.password

    # remove invisible / unicode / whitespace junk
    clean_password = (
        raw_password.strip()
        .encode("ascii", "ignore")   # removes weird unicode
        .decode()
    )

    # 🔍 DEBUG (you’ll see truth)
    print("RAW LENGTH:", len(raw_password))
    print("CLEAN LENGTH:", len(clean_password))

    # 🚫 VALIDATION
    if len(clean_password) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password too long (max 72 characters)"
        )

    if len(clean_password) < 6:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 6 characters"
        )

    # replace password with clean one
    user.password = clean_password

    # 1. Check if email already exists
    existing_user = user_logic.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")

    # 2. Create new user
    try:
        user_id = user_logic.create_user(db, user)
        return {"message": "User registered successfully", "user_id": user_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to register user") from exc

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


@router.post("/token", response_model=Token)
def login_for_swagger(
    form_data: OAuth2PasswordRequestForm = Depends(),
    db=Depends(get_db_connection),
):
    user = user_logic.get_user_by_email(db, form_data.username)
    if not user:
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not verify_password(form_data.password, user["password_hash"]):
        raise HTTPException(status_code=400, detail="Incorrect email or password")

    if not user["is_active"]:
        raise HTTPException(status_code=400, detail="User account is inactive")

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["email"], "id": user["id"], "role": user["role"]},
        expires_delta=access_token_expires,
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user_id": user["id"],
        "role": user["role"],
        "full_name": user["full_name"],
    }


@router.get("/me", response_model=CurrentUserResponse)
def get_me(
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    user = user_logic.get_user_by_id(db, current_user["id"])
    if not user or not user["is_active"]:
        raise HTTPException(status_code=404, detail="User not found")
    return user


@router.get("/users", response_model=list[dict])
def list_users(
    role: str | None = None,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    """Admin-only: list all users, optionally filtered by role."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    cursor = db.cursor(dictionary=True)
    try:
        if role:
            cursor.execute(
                "SELECT id, full_name, email, phone_number, role, is_active, created_at FROM users WHERE role = %s ORDER BY created_at DESC",
                (role,),
            )
        else:
            cursor.execute(
                "SELECT id, full_name, email, phone_number, role, is_active, created_at FROM users ORDER BY created_at DESC"
            )
        return cursor.fetchall()
    finally:
        cursor.close()


@router.post("/admin/create-user", response_model=dict, status_code=201)
def admin_create_user(
    user: UserRegister,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    """Admin-only: create a user with any role (including technician/admin)."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    existing = user_logic.get_user_by_email(db, user.email)
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    try:
        user_id = user_logic.create_user(db, user)
        return {"message": "User created successfully", "user_id": user_id}
    except Exception as exc:
        raise HTTPException(status_code=500, detail="Unable to create user") from exc


@router.patch("/users/{user_id}/toggle-active", response_model=dict)
def toggle_user_active(
    user_id: int,
    db=Depends(get_db_connection),
    current_user: dict = Depends(get_current_user_payload),
):
    """Admin-only: activate or deactivate a user account."""
    if current_user["role"] != "admin":
        raise HTTPException(status_code=403, detail="Admin access required")
    cursor = db.cursor(dictionary=True)
    try:
        cursor.execute("SELECT id, is_active FROM users WHERE id = %s", (user_id,))
        user = cursor.fetchone()
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        new_status = not user["is_active"]
        cursor.execute("UPDATE users SET is_active = %s WHERE id = %s", (new_status, user_id))
        db.commit()
        return {"user_id": user_id, "is_active": new_status}
    finally:
        cursor.close()
