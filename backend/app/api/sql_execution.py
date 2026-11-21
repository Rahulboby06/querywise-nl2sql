"""Read-only SQL execution API route."""

from fastapi import APIRouter

from app.schemas.sql_execution import SQLExecutionRequest, SQLExecutionResponse
from app.services.sql_execution import execute_sql
from app.services.sql_validation import validate_sql
from app.services import history

router = APIRouter(prefix="/api/sql", tags=["sql"])


@router.post("/execute", response_model=SQLExecutionResponse)
def execute_sql_query(request: SQLExecutionRequest) -> SQLExecutionResponse:
    """Execute a validated query using read-only database privileges."""
    if request.history_id is not None:
        validation = validate_sql(request.sql)
        history.update(request.history_id, attempted_sql=request.sql, execution_status="pending", execution_error=None,
                       validated_sql=validation.normalized_sql or request.sql,
                       validation_status="valid" if validation.valid else "invalid",
                       validation_error=None if validation.valid else "SQL did not pass read-only validation.",
                       execution_duration_ms=None, row_count=None, truncated=None)
    try:
        result = execute_sql(request.sql, request.limit)
    except Exception:
        if request.history_id is not None:
            history.update(request.history_id, execution_status="failed", execution_error="Query execution failed.")
        raise
    if request.history_id is not None:
        history.update(request.history_id, execution_status="succeeded" if result.success else "failed",
                       execution_error=None if result.success else "Query execution failed.",
                       execution_duration_ms=result.execution_time_ms,
                       row_count=result.row_count if result.success else None,
                       truncated=result.truncated if result.success else None)
    return result
