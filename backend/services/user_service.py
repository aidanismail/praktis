from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import insert
from models.user import User
from schemas.user import UserCreate
from core.security import get_password_hash

async def get_user_by_username(db: AsyncSession, username: str) -> User | None:
    result = await db.execute(select(User).where(User.username == username))
    return result.scalars().first()

async def create_user(db: AsyncSession, user_in: UserCreate) -> User:
    hashed_password = get_password_hash(user_in.password)
    db_user = User(
        email=user_in.email,
        username=user_in.username,
        role=user_in.role,
        hashed_password=hashed_password
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

async def bulk_create_users(db: AsyncSession, users_data: list[dict]) -> int:
    """
    users_data format: [{"email": "...", "username": "...", "role": "...", "hashed_password": "..."}]
    """
    if not users_data:
        return 0
        
    stmt = insert(User).values(users_data)
    stmt = stmt.on_conflict_do_nothing(index_elements=['username'])
    
    result = await db.execute(stmt)
    await db.commit()
    
    return result.rowcount