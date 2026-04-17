from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.transport import admin_compat, auth, booking, category, location, notification, package, service
from app.init_db import init_db

app = FastAPI(title="DeepCognix Facility Management API")


@app.on_event("startup")
def startup_event():
    """Auto-create all tables on first run."""
    init_db()


# Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://127.0.0.1:5173",
        "http://localhost:5173",
        "http://localhost:50565",
        "http://localhost:50560",
    ],
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

@app.get("/")
def read_root():
    return {"message": "Facility Management API is Running", "docs": "/docs"}
