from pydantic import Field, SecretStr
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    app_name: str = "NL2SQL AI Assistant"
    app_env: str = "development"
    app_host: str = "127.0.0.1"
    app_port: int = 8000
    frontend_origin: str = "http://localhost:5173"
    database_url: str = (
        "postgresql+psycopg://username:password@localhost:5432/nl2sql_db"
    )
    sql_execution_timeout_ms: int = Field(default=10_000, ge=1_000, le=60_000)
    gemini_api_key: SecretStr | None = None
    gemini_model: str = "gemini-2.5-flash"
    gemini_request_timeout_ms: int = Field(default=60_000, ge=1_000, le=180_000)

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
    )


settings = Settings()
