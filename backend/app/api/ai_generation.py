"""Natural-language SQL generation API routes."""

from fastapi import APIRouter

from app.schemas.ai_generation import AIGenerationRequest, AIGenerationResponse
from app.services.ai_sql_generation import generate_sql
from app.services import history

router = APIRouter(prefix="/api/ai", tags=["ai"])


@router.post("/generate", response_model=AIGenerationResponse)
def generate_sql_query(request: AIGenerationRequest) -> AIGenerationResponse:
    """Generate and validate SQL without executing the generated statement."""
    history_id = history.create(request.question)
    try:
        result = generate_sql(request.question)
    except Exception:
        history.update(history_id, generation_status="failed", generation_error="SQL generation failed.")
        raise
    history.update(
        history_id,
        generated_sql=result.original_generated_sql or result.generated_sql,
        generation_status="succeeded" if result.generated_sql else "failed",
        generation_error=None if result.generated_sql else "SQL generation failed.",
        validated_sql=result.generated_sql,
        validation_status=("valid" if result.validation.valid else "invalid") if result.generated_sql else "not_started",
        validation_error="Generated SQL did not pass validation." if result.generated_sql and not result.validation.valid else None,
    )
    result.history_id = history_id
    return result
