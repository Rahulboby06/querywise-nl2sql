"""Pydantic models for SQL generation requests and responses."""

from pydantic import BaseModel, ConfigDict, Field


class AIGenerationRequest(BaseModel):
    model_config = ConfigDict(str_strip_whitespace=True, extra="forbid")

    question: str = Field(min_length=1, max_length=4000)


class GeneratedSQLContent(BaseModel):
    """Structured response expected from the Gemini model."""

    sql: str = Field(max_length=20_000)
    explanation: str = Field(max_length=2000)


class AIGenerationValidation(BaseModel):
    valid: bool
    message: str
    validation_errors: list[str] = Field(default_factory=list)


class AIGenerationResponse(BaseModel):
    history_id: int | None = None
    success: bool
    generated_sql: str | None = None
    original_generated_sql: str | None = None
    explanation: str = ""
    tables_used: list[str] = Field(default_factory=list)
    validation: AIGenerationValidation
    error: str | None = None
