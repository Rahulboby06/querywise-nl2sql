"""Gemini-backed SQL generation with schema grounding and SQLGlot validation."""

import json

from google import genai
from google.genai import errors, types
from pydantic import SecretStr, ValidationError
from sqlalchemy.exc import SQLAlchemyError
from starlette.exceptions import HTTPException
from sqlglot import exp, parse_one
from sqlglot.errors import OptimizeError
from sqlglot.optimizer.qualify import qualify

from app.api.schema import read_database_schema
from app.core.config import settings
from app.prompts.sql_generation import build_sql_generation_system_prompt
from app.schemas.ai_generation import (
    AIGenerationResponse,
    AIGenerationValidation,
    GeneratedSQLContent,
)
from app.schemas.schema import SchemaResponse
from app.services.sql_validation import validate_sql

GENERATION_MAX_OUTPUT_TOKENS = 2048


def generate_sql(question: str) -> AIGenerationResponse:
    """Generate and validate SQL without executing it."""
    api_key = settings.gemini_api_key
    if not isinstance(api_key, SecretStr) or not api_key.get_secret_value().strip():
        return _failure("Gemini API key is not configured.")

    try:
        schema = read_database_schema()
    except (HTTPException, SQLAlchemyError):
        return _failure("Database schema is currently unavailable.")
    except Exception:
        return _failure("Database schema is currently unavailable.")

    if not schema.tables:
        return _failure("Database schema is empty; SQL generation is unavailable.")

    system_prompt = build_sql_generation_system_prompt(schema)
    try:
        client = genai.Client(
            api_key=api_key.get_secret_value(),
            http_options=types.HttpOptions(timeout=settings.gemini_request_timeout_ms),
        )
        response = client.models.generate_content(
            model=settings.gemini_model,
            contents=question,
            config=types.GenerateContentConfig(
                system_instruction=system_prompt,
                response_mime_type="application/json",
                response_schema=GeneratedSQLContent,
                max_output_tokens=GENERATION_MAX_OUTPUT_TOKENS,
                thinking_config=types.ThinkingConfig(
                    thinking_level=types.ThinkingLevel.LOW,
                ),
            ),
        )
        generated = _parse_model_response(response)
    except (ValidationError, ValueError, TypeError, json.JSONDecodeError):
        return _failure("Gemini returned a malformed SQL generation response.")
    except (TimeoutError, errors.APIError) as error:
        return _provider_failure(error)
    except Exception as error:
        return _provider_failure(error)

    if not generated.sql.strip():
        return _failure(
            generated.explanation.strip()
            or "The question cannot be answered from the available database schema."
        )

    validation = validate_sql(generated.sql)
    validation_result = AIGenerationValidation(
        valid=validation.valid,
        message=validation.message,
        validation_errors=validation.validation_errors,
    )
    if not validation.valid or validation.normalized_sql is None:
        return AIGenerationResponse(
            success=False,
            generated_sql=generated.sql,
            original_generated_sql=generated.sql,
            explanation=generated.explanation,
            tables_used=[],
            validation=validation_result,
            error="Generated SQL did not pass read-only validation.",
        )

    schema_error = _schema_reference_error(validation.normalized_sql, schema)
    if schema_error:
        schema_validation = AIGenerationValidation(
            valid=False,
            message=schema_error,
            validation_errors=[schema_error],
        )
        return AIGenerationResponse(
            success=False,
            generated_sql=generated.sql,
            original_generated_sql=generated.sql,
            explanation=generated.explanation,
            validation=schema_validation,
            error=schema_error,
        )

    return AIGenerationResponse(
        success=True,
        generated_sql=validation.normalized_sql,
        original_generated_sql=generated.sql,
        explanation=generated.explanation,
        tables_used=_tables_referenced(validation.normalized_sql, schema),
        validation=validation_result,
    )


def _parse_model_response(response: object) -> GeneratedSQLContent:
    parsed = getattr(response, "parsed", None)
    if isinstance(parsed, GeneratedSQLContent):
        return parsed
    if parsed is not None:
        return GeneratedSQLContent.model_validate(parsed)

    response_text = getattr(response, "text", None)
    if not isinstance(response_text, str) or not response_text.strip():
        raise ValueError("Gemini response did not contain structured output.")
    return GeneratedSQLContent.model_validate_json(response_text)


def _tables_referenced(sql: str, schema: SchemaResponse) -> list[str]:
    """Return real schema table names referenced by the validated query."""
    statement = parse_one(sql, read="postgres")
    actual_names = {table.name.casefold(): table.name for table in schema.tables}
    cte_names = {
        cte.alias_or_name.casefold()
        for cte in statement.find_all(exp.CTE)
        if cte.alias_or_name
    }
    referenced = {
        actual_names[node.name.casefold()]
        for node in statement.find_all(exp.Table)
        if node.name.casefold() not in cte_names
        if node.name.casefold() in actual_names
    }
    return sorted(referenced)


def _schema_reference_error(sql: str, schema: SchemaResponse) -> str | None:
    """Reject physical tables or columns absent from the inspected schema."""
    statement = parse_one(sql, read="postgres")
    schema_names = {table.name.casefold() for table in schema.tables}
    cte_names = {
        cte.alias_or_name.casefold()
        for cte in statement.find_all(exp.CTE)
        if cte.alias_or_name
    }

    for table in statement.find_all(exp.Table):
        name = table.name.casefold()
        if name in cte_names:
            continue
        if (
            name not in schema_names
            or table.catalog
            or table.db and table.db.casefold() != "public"
        ):
            return "Generated SQL references a table that is not present in the database schema."

    known_schema = {
        table.name: {column.name: column.data_type for column in table.columns}
        for table in schema.tables
    }
    try:
        qualify(
            statement,
            dialect="postgres",
            schema=known_schema,
            validate_qualify_columns=True,
            quote_identifiers=False,
        )
    except OptimizeError:
        return "Generated SQL references columns that are missing or ambiguous in the database schema."
    return None


def _provider_failure(error: Exception) -> AIGenerationResponse:
    status_code = getattr(error, "code", None) or getattr(
        error, "status_code", None
    )
    is_timeout = isinstance(error, TimeoutError) or any(
        "timeout" in exception_type.__name__.casefold()
        for exception_type in type(error).__mro__
    )
    if is_timeout or status_code in (408, 504, "408", "504"):
        return _failure("Gemini request timed out.")
    if status_code in (429, "429"):
        return _failure("Gemini rate limit reached. Try again shortly.")
    return _failure("Gemini SQL generation is temporarily unavailable.")


def _failure(message: str) -> AIGenerationResponse:
    return AIGenerationResponse(
        success=False,
        validation=AIGenerationValidation(
            valid=False,
            message=message,
            validation_errors=[message],
        ),
        error=message,
    )
