import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.database import AsyncSessionLocal
from schemas.user import UserCreate
from services.user_service import create_user, get_user_by_username
from models.user import RoleEnum

async def seed_user():
    async with AsyncSessionLocal() as db:
        user_username = "aidan"

        existing_username = await get_user_by_username(db, user_username)
        if existing_username:
            print(f"User '{user_username}' already exists")
            return
        
        admin_user = UserCreate(
            email = "aidan@unpad.ac.id",
            username=user_username,
            role=RoleEnum.PRAKTIKAN,
            password="password123"
        )

        await create_user(db, admin_user)
        print(f"User '{user_username}' created successfully")

if __name__ == "__main__":
    asyncio.run(seed_user())
