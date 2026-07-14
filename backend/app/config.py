from pydantic import Field, field_validator
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    PORT: int = Field(default=8080, description="Порт запуска приложения (uvicorn)")
    DATABASE_URL: str = Field(
        default="sqlite+aiosqlite:///./data/zapisi.db",
        description="URL подключения к БД (sqlite+aiosqlite:///... или postgresql+asyncpg://...)",
    )
    ADMIN_PASSWORD: str = Field(default="admin", description="Пароль администратора")

    @field_validator("DATABASE_URL", mode="before")
    @classmethod
    def validate_database_url(cls, v: str) -> str:
        if v.startswith("postgresql://"):
            return v.replace("postgresql://", "postgresql+asyncpg://", 1)
        if v.startswith("postgres://"):
            return v.replace("postgres://", "postgresql+asyncpg://", 1)
        return v

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore"
    )


settings = Settings()
