from typing import Literal

from pydantic import Field
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    # Google Cloud
    PROJECT_NAME: str = Field(default="local-project")
    ENVIRONMENT: Literal["development", "production"] = Field(
        default="development"
    )  # development, production
    # Service Account credentials para GCP (Storage signing)
    GCP_SERVICE_ACCOUNT_EMAIL: str = Field(default="")
    GCP_SERVICE_ACCOUNT_PRIVATE_KEY: str = Field(default="")

    # PostgreSQL Database (Cloud SQL)
    DATABASE_HOST: str = Field(default="localhost")
    DATABASE_PORT: int = Field(default=5432)
    DATABASE_NAME: str = Field(default="talent")
    DATABASE_USER: str = Field(default="postgres")
    DATABASE_PASSWORD: str = Field(default="")


    # CORS / Cookies
    CORS_ORIGINS: list[str] = Field(
        default_factory=lambda: [
            "http://localhost:3000",
        ]
    )
    COOKIE_SECURE: bool = Field(default=False)
    COOKIE_SAMESITE: str = Field(default="lax")

    COOKIE_DOMAIN: str = Field(default="")

    FRONTEND_URL: str = Field(default="http://localhost:3000")

    # JWT / Auth
    JWT_SECRET: str = Field(default="change-me-in-production")
    JWT_EXPIRATION_HOURS: int = Field(default=24)

    # Email (Resend)
    RESEND_KEY: str = Field(default="")
    RESEND_FROM_EMAIL: str = Field(default="")

    # Google OAuth (from Firebase Console → Auth → Google provider)
    GOOGLE_CLIENT_ID: str = Field(default="")
    GOOGLE_CLIENT_SECRET: str = Field(default="")
    GOOGLE_TOKEN_ENCRYPTION_KEY: str = Field(
        default=""
    )  # Fernet key for encrypting Calendar tokens

    BACKEND_PUBLIC_URL: str = Field(default="")

    model_config = SettingsConfigDict(
        env_file=".env", env_file_encoding="utf-8", extra="ignore"
    )


settings = Settings()