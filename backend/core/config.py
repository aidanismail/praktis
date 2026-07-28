from pathlib import Path

from pydantic_settings import BaseSettings, SettingsConfigDict


ENV_FILE = Path(__file__).resolve().parents[2] / ".env"


class Settings(BaseSettings):

    # postgres (db) conf
    POSTGRES_USER: str
    POSTGRES_PASSWORD: str
    POSTGRES_DB: str
    DATABASE_URL: str

    # jwt conf
    JWT_SECRET: str # TODO: change the env in prod
    JWT_ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 30

    # cors
    CORS_ORIGINS: str = "http://localhost:8080"

    # environment
    ENVIRONMENT: str = "development"

    # security policies
    PASSWORD_MIN_LENGTH: int = 8

    # student import limits
    IMPORT_MAX_BYTES: int = 5 * 1024 * 1024
    IMPORT_MAX_ROWS: int = 2000

    # module upload limit
    MODULE_MAX_UPLOAD_BYTES: int = 25 * 1024 * 1024

    #redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # minio conf
    MINIO_ROOT_USER: str
    MINIO_ROOT_PASSWORD: str
    MINIO_ENDPOINT: str
    MINIO_PUBLIC_ENDPOINT: str = "http://localhost:8080"
    MINIO_USE_SSL: bool = False
    MINIO_BUCKET_NAME: str = "praktis-modules"

    @property
    def async_database_url(self) -> str:
        return self.DATABASE_URL.replace("postgresql://", "postgresql+asyncpg://")
    
    model_config = SettingsConfigDict(env_file=ENV_FILE, extra="ignore")

settings = Settings()  # type: ignore
