from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.transport import auth, category, service

app = FastAPI(title="DeepCognix Facility Management API")

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

@app.get("/")
def read_root():
    return {"message": "Facility Management API is Running", "docs": "/docs"}