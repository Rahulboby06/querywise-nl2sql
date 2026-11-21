"""Pydantic request and response models for SQL validation."""

from pydantic import BaseModel, ConfigDict, Field


class SQLValidationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True)

    sql: str = Field(min_length=1, max_length=20_000)
    history_id: int | None = Field(default=None, gt=0)


class SQLValidationResponse(BaseModel):
    valid: bool
    message: str
    normalized_sql: str | None = None
    validation_errors: list[str] = Field(default_factory=list)
