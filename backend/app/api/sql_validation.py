"""SQL validation API routes."""

from fastapi import APIRouter

from app.schemas.sql_validation import SQLValidationRequest, SQLValidationResponse
from app.services.sql_validation import validate_sql
from app.services import history

router = APIRouter(prefix="/api/sql", tags=["sql"])


@router.post("/validate", response_model=SQLValidationResponse)
def validate_sql_query(request: SQLValidationRequest) -> SQLValidationResponse:
    """Return validation results only; submitted SQL is never executed."""
    if request.history_id is not None:
        history.update(request.history_id, validated_sql=request.sql, validation_status="pending", validation_error=None,
                       execution_status="not_started", execution_error=None, attempted_sql=None,
                       execution_duration_ms=None, row_count=None, truncated=None)
    try:
        result = validate_sql(request.sql)
    except Exception:
        if request.history_id is not None:
            history.update(request.history_id, validation_status="failed", validation_error="SQL validation failed.")
        raise
    if request.history_id is not None:
        history.update(request.history_id, validated_sql=result.normalized_sql or request.sql,
                       validation_status="valid" if result.valid else "invalid",
                       validation_error=None if result.valid else "SQL did not pass read-only validation.")
    return result
