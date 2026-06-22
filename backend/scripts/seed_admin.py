import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.database import AsyncSessionLocal
from schemas.user import UserCreate
from services.user_service import create_user, get_user_by_username
from models.user import RoleEnum

async def seed_admin():
    async with AsyncSessionLocal() as db:
        admin_username = "admin"

        existing_username = await get_user_by_username(db, admin_username)
        if existing_username:
            print(f"User '{admin_username}' already exists")
            return
        
        admin_user = UserCreate(
            email = "admin@praktis.unpad.ac.id",
            username=admin_username,
            role=RoleEnum.SUPERADMIN,
            password="PunyaAidanBagas123"
        )

        await create_user(db, admin_user)
        print(f"User '{admin_username}' created successfully")

if __name__ == "__main__":
    asyncio.run(seed_admin())
