# This file is for password hashing and jwt token generation

from datetime import datetime, timedelta
from typing import Optional
from jose import jwt
from passlib.context import CryptContext
from app.core.config import settings

# 🔥 SWITCHED FROM BCRYPT → PBKDF2 (NO 72 BYTE LIMIT)
pwd_context = CryptContext(schemes=["pbkdf2_sha256"], deprecated="auto")


# =====================================================================
# PASSWORD VERIFY
# =====================================================================
def verify_password(plain_password, hashed_password):
    try:
        plain_password = str(plain_password).strip()
        return pwd_context.verify(plain_password, hashed_password)
    except Exception as e:
        print("VERIFY ERROR:", e)
        return False


# =====================================================================
# PASSWORD HASH (STABLE)
# =====================================================================
def get_password_hash(password):
    try:
        password = str(password).strip()

        print("HASH INPUT:", password)
        print("LENGTH:", len(password))

        return pwd_context.hash(password)

    except Exception as e:
        print("HASH ERROR:", e)
        raise e


# =====================================================================
# JWT TOKEN
# =====================================================================
def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(
            minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES
        )

    to_encode.update({"exp": expire})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt