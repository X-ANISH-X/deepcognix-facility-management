import os

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.transport import admin_compat, auth, booking, category, location, notification, package, service, tracking_map
from app.init_db import init_db

app = FastAPI(title="DeepCognix Facility Management API")


def _parse_allowed_origins() -> list[str]:
    raw_origins = os.getenv("CORS_ALLOW_ORIGINS", "")
    if raw_origins.strip():
        return [origin.strip() for origin in raw_origins.split(",") if origin.strip()]

    return [
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://127.0.0.1:5174",
        "http://localhost:5174",
        "http://127.0.0.1:5175",
        "http://localhost:5175",
        "http://127.0.0.1:4173",
        "http://localhost:4173",
        "http://localhost:50565",
        "http://localhost:50560",
    ]


@app.on_event("startup")
def startup_event():
    """Auto-create all tables on first run."""
    init_db()


# Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=_parse_allowed_origins(),
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(category.router)
app.include_router(service.router)
app.include_router(package.router)
app.include_router(booking.router)
app.include_router(location.router)
app.include_router(notification.router)
app.include_router(admin_compat.router)
app.include_router(tracking_map.router)

@app.get("/")
def read_root():
    return {"message": "Facility Management API is Running", "docs": "/docs"}
