from fastapi import FastAPI, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from core.config import settings

from api.routers import users
from api.routers import modules
from api.routers import attendance

app = FastAPI(title="Praktis API", 
              version="1.0.0",
              root_path="/api")

origins = [origin.strip() for origin in settings.CORS_ORIGINS.split(",")]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(users.router)
app.include_router(modules.router)
app.include_router(attendance.router)

@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "db_connected": True}

