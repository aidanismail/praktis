import os
from pathlib import Path

# Settings are instantiated at import time, so the environment must be
# prepared before anything from the app is imported.
user = os.environ.get("POSTGRES_USER", "praktis_admin")
password = os.environ.get("POSTGRES_PASSWORD", "PunyaAidanBagas123")
default_test_url = f"postgresql://{user}:{password}@localhost:5432/praktis_test"

TEST_DATABASE_URL = os.environ.get("TEST_DATABASE_URL", default_test_url)
os.environ["DATABASE_URL"] = TEST_DATABASE_URL
os.environ.setdefault("POSTGRES_USER", user)
os.environ.setdefault("POSTGRES_PASSWORD", password)
os.environ.setdefault("POSTGRES_DB", "praktis_test")
os.environ.setdefault("JWT_SECRET", "supersecret_jwt_key_that_is_at_least_32_bytes_long")
os.environ.setdefault("MINIO_ENDPOINT", "localhost:9000")
os.environ.setdefault("MINIO_ROOT_USER", os.environ.get("MINIO_ROOT_USER", "admin"))
os.environ.setdefault("MINIO_ROOT_PASSWORD", os.environ.get("MINIO_ROOT_PASSWORD", "SuperSecretMinio123"))

import asyncio

import pytest
import pytest_asyncio
from alembic import command
from alembic.config import Config as AlembicConfig
from httpx import ASGITransport, AsyncClient
from sqlalchemy import text
from sqlalchemy.ext.asyncio import async_sessionmaker, create_async_engine

from core.database import get_db
from main import app

BASE_DIR = Path(__file__).resolve().parents[1]
ASYNC_TEST_URL = TEST_DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")

TABLES = "users, courses, class_sessions, enrollments, course_staff, modules, attendances, grades, announcements, announcement_comments, assignments, submissions"


async def _create_database_if_missing() -> None:
    server_url, db_name = ASYNC_TEST_URL.rsplit("/", 1)
    engine = create_async_engine(f"{server_url}/postgres", isolation_level="AUTOCOMMIT")
    async with engine.connect() as conn:
        exists = await conn.scalar(
            text("SELECT 1 FROM pg_database WHERE datname = :name"), {"name": db_name}
        )
        if not exists:
            await conn.execute(text(f'CREATE DATABASE "{db_name}"'))
    await engine.dispose()


@pytest.fixture(scope="session", autouse=True)
def _setup_database():
    asyncio.run(_create_database_if_missing())
    cfg = AlembicConfig(str(BASE_DIR / "alembic.ini"))
    cfg.set_main_option("script_location", str(BASE_DIR / "migrations"))
    command.upgrade(cfg, "head")


@pytest_asyncio.fixture
async def db_engine():
    engine = create_async_engine(ASYNC_TEST_URL)
    yield engine
    await engine.dispose()


@pytest_asyncio.fixture
async def db(db_engine):
    async with db_engine.begin() as conn:
        await conn.execute(text(f"TRUNCATE {TABLES} CASCADE"))
    maker = async_sessionmaker(db_engine, expire_on_commit=False)
    async with maker() as session:
        yield session


@pytest_asyncio.fixture
async def client(db_engine, db):
    maker = async_sessionmaker(db_engine, expire_on_commit=False)

    async def override_get_db():
        async with maker() as session:
            yield session

    app.dependency_overrides[get_db] = override_get_db
    transport = ASGITransport(app=app)
    async with AsyncClient(transport=transport, base_url="http://test") as c:
        yield c
    app.dependency_overrides.clear()
