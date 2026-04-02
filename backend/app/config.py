"""
Application configuration using Pydantic BaseSettings.
All values are loaded from environment variables or a .env file.
"""

from typing import List, Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables."""

    # ── Application ──────────────────────────────────────────────
    APP_NAME: str = "InsightX AI Engine"
    APP_VERSION: str = "1.0.0"
    DEBUG: bool = False
    LOG_LEVEL: str = "INFO"

    # ── Database ─────────────────────────────────────────────────
    DATABASE_URL: str = Field(
        default="postgresql+asyncpg://postgres:postgres@localhost:5432/jd_financial",
        description="Async SQLAlchemy database URL",
    )
    DB_POOL_SIZE: int = 20
    DB_MAX_OVERFLOW: int = 10
    DB_POOL_TIMEOUT: int = 30

    # ── Anthropic / Claude ───────────────────────────────────────
    ANTHROPIC_API_KEY: str = Field(default="", description="Anthropic API key for Claude")
    ANTHROPIC_MODEL: str = "claude-sonnet-4-20250514"
    ANTHROPIC_MAX_TOKENS: int = 4096
    ANTHROPIC_TEMPERATURE: float = 0.1

    # ── Anaplan Connector ────────────────────────────────────────
    ANAPLAN_CLIENT_ID: str = ""
    ANAPLAN_CLIENT_SECRET: str = ""
    ANAPLAN_API_BASE_URL: str = "https://api.anaplan.com/2/0"
    ANAPLAN_AUTH_URL: str = "https://auth.anaplan.com/token/authenticate"

    # ── Power BI Connector ───────────────────────────────────────
    POWERBI_TENANT_ID: str = ""
    POWERBI_CLIENT_ID: str = ""
    POWERBI_CLIENT_SECRET: str = ""
    POWERBI_API_BASE_URL: str = "https://api.powerbi.com/v1.0/myorg"
    POWERBI_AUTHORITY_URL: str = "https://login.microsoftonline.com"
    POWERBI_SCOPE: str = "https://analysis.windows.net/powerbi/api/.default"

    # ── Azure AD Authentication ──────────────────────────────────
    AZURE_AD_TENANT_ID: str = ""
    AZURE_AD_CLIENT_ID: str = ""
    AZURE_AD_AUDIENCE: str = ""
    AZURE_AD_ISSUER: Optional[str] = None

    # ── CORS ─────────────────────────────────────────────────────
    CORS_ORIGINS: List[str] = Field(
        default=["http://localhost:5001", "http://localhost:5173"],
        description="Allowed CORS origins",
    )

    # ── Rate Limiting ────────────────────────────────────────────
    RATE_LIMIT_REQUESTS: int = 60
    RATE_LIMIT_WINDOW_SECONDS: int = 60

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        case_sensitive = True


settings = Settings()
