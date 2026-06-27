import asyncio
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from core.database import AsyncSessionLocal
from schemas.user import UserCreate
from services.user_service import create_user, get_user_by_username
from models.user import RoleEnum


USERS_TO_SEED = [
    {
        "email": "admin@praktis.unpad.ac.id",
        "username": "admin",
        "role": RoleEnum.SUPERADMIN,
        "password": "aidanbagas123",
        "force_password_change": False,
    },
    {
        "email": "asprak@unpad.ac.id",
        "username": "asprak",
        "role": RoleEnum.ASPRAK,
        "password": "asprak123",
        "force_password_change": False,
    },
    {
        "email": "aidan@unpad.ac.id",
        "username": "aidan",
        "role": RoleEnum.PRAKTIKAN,
        "password": "password123",
        "force_password_change": True,
    },
]


async def seed_user(db, user_data: dict):
    existing_user = await get_user_by_username(db, user_data["username"])

    if existing_user:
        print(f"User '{user_data['username']}' already exists")
        return

    user_create = UserCreate(
        email=user_data["email"],
        username=user_data["username"],
        role=user_data["role"],
        password=user_data["password"],
    )

    created_user = await create_user(db, user_create)

    # Optional override if your create_user returns the created User model.
    # This is useful because your DB model probably defaults force_password_change=True.
    if created_user and hasattr(created_user, "force_password_change"):
        created_user.force_password_change = user_data["force_password_change"]
        await db.commit()
        await db.refresh(created_user)

    print(f"User '{user_data['username']}' created successfully")


async def main():
    async with AsyncSessionLocal() as db:
        for user_data in USERS_TO_SEED:
            await seed_user(db, user_data)


if __name__ == "__main__":
    asyncio.run(main())