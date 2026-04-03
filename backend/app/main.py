from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.transport import auth, category, service, booking, location
from app.init_db import init_db

app = FastAPI(title="DeepCognix Facility Management API")


@app.on_event("startup")
def startup_event():
    init_db()

# Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register Routers
app.include_router(auth.router, prefix="/auth", tags=["Authentication"])

# Category Routers
app.include_router(category.router)

# Service Routers
app.include_router(service.router)

# Booking Routers
app.include_router(booking.router)

# Location Routers
app.include_router(location.router)

@app.get("/")
def read_root():
    return {"message": "Facility Management API is Running", "docs": "/docs"}