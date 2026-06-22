from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings
from api.routers import users

app = FastAPI(title="Praktis API", version="1.0.0")

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router, prefix="/api")

@app.get("/api/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "db_connected": True}