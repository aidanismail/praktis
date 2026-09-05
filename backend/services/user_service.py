import asyncio
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy.dialects.postgresql import insert as pg_insert
from sqlalchemy import CursorResult
from models.user import User, RoleEnum
from schemas.user import UserCreate
from core.security import get_password_hash


async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    hashed_password = await asyncio.to_thread(get_password_hash, user_in.password)
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        role=user_in.role,
        hashed_password=hashed_password,
        force_password_change=(user_in.role == RoleEnum.PRAKTIKAN),
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def bulk_create_users(db: AsyncSession, users_data: list[dict]) -> int:
    if not users_data:
        return 0
        
    stmt = pg_insert(User).values(users_data)
    stmt = stmt.on_conflict_do_nothing(index_elements=['username'])
    
    result = await db.execute(stmt)
    assert isinstance(result, CursorResult)
    await db.commit()
    
    return result.rowcount