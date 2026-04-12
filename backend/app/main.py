from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.transport import auth, booking, category, location, notification, package, service

app = FastAPI(title="DeepCognix Facility Management API")

# Allow Frontend to talk to Backend (CORS)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, change this to your frontend URL
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

@app.get("/")
def read_root():
    return {"message": "Facility Management API is Running", "docs": "/docs"}
