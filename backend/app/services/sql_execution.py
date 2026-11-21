"""Execute validated SELECT queries in a bounded read-only transaction."""

from base64 import b64encode
from datetime import date, datetime, time
from decimal import Decimal
from time import perf_counter
from uuid import UUID

from sqlalchemy import text
from sqlalchemy.exc import SQLAlchemyError

from app.core.config import settings
from app.database import engine
from app.schemas.sql_execution import SQLExecutionResponse
from app.services.sql_validation import validate_sql

MAX_RESULT_LIMIT = 1000
DEFAULT_RESULT_LIMIT = 100


def execute_sql(sql: str, limit: int = DEFAULT_RESULT_LIMIT) -> SQLExecutionResponse:
    """Validate, then execute one SELECT with server-enforced safety limits."""
    started_at = perf_counter()
    validation = validate_sql(sql)
    if not validation.valid or validation.normalized_sql is None:
        return _failure(
            validation.message,
            started_at,
        )

    # Clamp here as a second boundary; the request model also enforces this.
    safe_limit = min(max(int(limit), 1), MAX_RESULT_LIMIT)
    query = text(
        f"SELECT * FROM ({validation.normalized_sql}) AS _nl2sql_result "
        "LIMIT :_nl2sql_limit"
    )

    try:
        with engine.connect() as connection:
            with connection.begin():
                connection.exec_driver_sql("SET TRANSACTION READ ONLY")
                connection.execute(
                    text("SELECT set_config('statement_timeout', :timeout, true)"),
                    {"timeout": f"{settings.sql_execution_timeout_ms}ms"},
                )
                result = connection.execute(
                    query,
                    {"_nl2sql_limit": safe_limit + 1},
                )
                columns = list(result.keys())
                result_rows = result.mappings().fetchmany(safe_limit + 1)
    except SQLAlchemyError as error:
        # PostgreSQL uses SQLSTATE 57014 for statement cancellations/timeouts.
        original = getattr(error, "orig", None)
        sqlstate = getattr(original, "sqlstate", None) or getattr(
            original, "pgcode", None
        )
        message = (
            "Query execution timed out."
            if sqlstate == "57014"
            else "Query execution failed. Check the query and database availability."
        )
        return _failure(message, started_at)
    except Exception:
        # Keep unexpected driver/serialization details and traces private.
        return _failure("Query execution failed.", started_at)

    truncated = len(result_rows) > safe_limit
    rows = [
        {column: _json_compatible(value) for column, value in row.items()}
        for row in result_rows[:safe_limit]
    ]
    return SQLExecutionResponse(
        success=True,
        columns=columns,
        rows=rows,
        row_count=len(rows),
        execution_time_ms=_elapsed_ms(started_at),
        truncated=truncated,
    )


def _json_compatible(value: object) -> object:
    if value is None or isinstance(value, (str, int, float, bool)):
        return value
    if isinstance(value, (datetime, date, time)):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if isinstance(value, UUID):
        return str(value)
    if isinstance(value, bytes):
        return b64encode(value).decode("ascii")
    if isinstance(value, dict):
        return {str(key): _json_compatible(item) for key, item in value.items()}
    if isinstance(value, (list, tuple)):
        return [_json_compatible(item) for item in value]
    return str(value)


def _failure(message: str, started_at: float) -> SQLExecutionResponse:
    return SQLExecutionResponse(
        success=False,
        execution_time_ms=_elapsed_ms(started_at),
        error=message,
    )


def _elapsed_ms(started_at: float) -> float:
    return round((perf_counter() - started_at) * 1000, 3)
