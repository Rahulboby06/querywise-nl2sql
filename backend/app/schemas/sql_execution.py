"""Pydantic models for read-only SQL execution."""

from pydantic import BaseModel, ConfigDict, Field


class SQLExecutionRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    sql: str = Field(min_length=1, max_length=20_000)
    limit: int = Field(default=100, ge=1, le=1000)
    history_id: int | None = Field(default=None, gt=0)


class SQLExecutionResponse(BaseModel):
    success: bool
    columns: list[str] = Field(default_factory=list)
    rows: list[dict[str, object]] = Field(default_factory=list)
    row_count: int = 0
    execution_time_ms: float = 0
    truncated: bool = False
    error: str | None = None
