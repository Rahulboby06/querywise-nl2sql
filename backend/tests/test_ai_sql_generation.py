"""Mocked tests for schema-grounded Gemini SQL generation."""

import unittest
from types import SimpleNamespace
from unittest.mock import MagicMock, patch

from pydantic import SecretStr
from fastapi.testclient import TestClient
from starlette.exceptions import HTTPException

from app.core.config import Settings
from app.main import app
from app.schemas.ai_generation import GeneratedSQLContent
from app.schemas.schema import (
    ColumnMetadata,
    DatabaseMetadata,
    ForeignKeyMetadata,
    PrimaryKeyMetadata,
    SchemaResponse,
    TableMetadata,
)
from app.services.ai_sql_generation import generate_sql


def make_schema() -> SchemaResponse:
    departments = TableMetadata(
        name="departments",
        columns=[
            ColumnMetadata(
                name="department_id", data_type="integer", nullable=False, default=None
            ),
            ColumnMetadata(
                name="department_name", data_type="character varying(100)", nullable=False, default=None
            ),
        ],
        primary_key=PrimaryKeyMetadata(name="departments_pkey", columns=["department_id"]),
        foreign_keys=[],
        unique_constraints=[],
        check_constraints=[],
        indexes=[],
    )
    employees = TableMetadata(
        name="employees",
        columns=[
            ColumnMetadata(
                name="employee_id", data_type="integer", nullable=False, default=None
            ),
            ColumnMetadata(
                name="department_id", data_type="integer", nullable=True, default=None
            ),
            ColumnMetadata(
                name="salary", data_type="numeric(10,2)", nullable=False, default=None
            ),
        ],
        primary_key=PrimaryKeyMetadata(name="employees_pkey", columns=["employee_id"]),
        foreign_keys=[
            ForeignKeyMetadata(
                name="employees_department_id_fkey",
                columns=["department_id"],
                referred_schema="public",
                referred_table="departments",
                referred_columns=["department_id"],
                options={},
            )
        ],
        unique_constraints=[],
        check_constraints=[],
        indexes=[],
    )
    return SchemaResponse(
        database=DatabaseMetadata(name="nl2sql_db", engine="PostgreSQL", version="18"),
        tables=[departments, employees],
    )


class AISQLGenerationTests(unittest.TestCase):
    def setUp(self) -> None:
        self.schema = make_schema()
        self.key_patch = patch(
            "app.services.ai_sql_generation.settings.gemini_api_key",
            SecretStr("test-key-that-must-not-be-exposed"),
        )
        self.key_patch.start()
        self.addCleanup(self.key_patch.stop)

    def make_client(self, response: object) -> MagicMock:
        client = MagicMock()
        client.models.generate_content.return_value = response
        return client

    def test_gemini_request_timeout_defaults_to_sixty_seconds(self) -> None:
        config = Settings(_env_file=None)
        self.assertEqual(config.gemini_request_timeout_ms, 60_000)

    def test_successful_generation_uses_schema_and_structured_json(self) -> None:
        response = SimpleNamespace(
            parsed={
                "sql": "SELECT e.employee_id, e.salary, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id ORDER BY e.salary DESC LIMIT 5",
                "explanation": "Lists the five highest-paid employees and their departments.",
            },
            text=None,
        )
        client = self.make_client(response)
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client) as client_factory,
        ):
            result = generate_sql("Show the top 5 highest-paid employees with their department names.")

        self.assertTrue(result.success, result.error)
        self.assertTrue(result.validation.valid)
        self.assertEqual(result.tables_used, ["departments", "employees"])
        self.assertIn("JOIN departments", result.generated_sql or "")
        config = client.models.generate_content.call_args.kwargs["config"]
        self.assertEqual(config.response_mime_type, "application/json")
        self.assertIs(config.response_schema, GeneratedSQLContent)
        self.assertIn("Actual database schema context", config.system_instruction)
        self.assertIn('"department_id"', config.system_instruction)
        self.assertIn("employees_department_id_fkey", config.system_instruction)
        self.assertIn("read-only SELECT", config.system_instruction)
        self.assertEqual(config.thinking_config.thinking_level, "LOW")
        self.assertEqual(client_factory.call_args.kwargs["http_options"].timeout, 60_000)
        self.assertEqual(client_factory.call_args.kwargs["api_key"], "test-key-that-must-not-be-exposed")

    def test_generate_http_endpoint_with_mocked_gemini(self) -> None:
        client = self.make_client(
            SimpleNamespace(
                parsed={
                    "sql": "SELECT employee_id FROM employees",
                    "explanation": "Returns employee identifiers.",
                },
                text=None,
            )
        )
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client),
            patch("app.api.ai_generation.history.create", return_value=1),
            patch("app.api.ai_generation.history.update"),
        ):
            response = TestClient(app).post(
                "/api/ai/generate", json={"question": "List employee identifiers"}
            )
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.json()["success"])
        self.assertEqual(response.json()["tables_used"], ["employees"])

    def test_existing_routes_remain_available_without_database_calls(self) -> None:
        connection = MagicMock()
        connection.__enter__.return_value = connection

        def execute(statement: object) -> MagicMock:
            result = MagicMock()
            statement_text = str(statement)
            if "current_database" in statement_text:
                result.scalar_one.return_value = "nl2sql_db"
            elif "server_version" in statement_text:
                result.scalar_one.return_value = "18"
            return result

        connection.execute.side_effect = execute
        inspector = MagicMock()
        inspector.get_table_names.return_value = []
        client = TestClient(app)
        with (
            patch("app.api.schema.engine.connect") as connect,
            patch("app.api.schema.inspect", return_value=inspector),
        ):
            connect.return_value.__enter__.return_value = connection
            health = client.get("/api/health")
            database_health = client.get("/api/health/database")
            schema = client.get("/api/schema")
            validation = client.post("/api/sql/validate", json={"sql": "SELECT 1"})
            execution = client.post(
                "/api/sql/execute", json={"sql": "DELETE FROM employees"}
            )

        self.assertEqual(health.status_code, 200)
        self.assertEqual(database_health.status_code, 200)
        self.assertEqual(schema.status_code, 200)
        self.assertEqual(validation.status_code, 200)
        self.assertTrue(validation.json()["valid"])
        self.assertEqual(execution.status_code, 200)
        self.assertFalse(execution.json()["success"])

    def test_structured_response_text_is_parsed(self) -> None:
        client = self.make_client(
            SimpleNamespace(
                parsed=None,
                text='{"sql":"SELECT department_id FROM employees","explanation":"Returns employee department IDs."}',
            )
        )
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client),
        ):
            result = generate_sql("List employee department IDs")
        self.assertTrue(result.success, result.error)
        self.assertEqual(result.tables_used, ["employees"])

    def test_tables_used_excludes_cte_aliases(self) -> None:
        client = self.make_client(
            SimpleNamespace(
                parsed={
                    "sql": "WITH employees AS (SELECT department_id FROM departments) SELECT department_id FROM employees",
                    "explanation": "Lists departments referenced by the common table expression.",
                },
                text=None,
            )
        )
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client),
        ):
            result = generate_sql("List department IDs")
        self.assertTrue(result.success, result.error)
        self.assertEqual(result.tables_used, ["departments"])

    def test_invalid_generated_sql_is_returned_but_not_rewritten_or_executed(self) -> None:
        client = self.make_client(
            SimpleNamespace(
                parsed={"sql": "DELETE FROM employees", "explanation": "Invalid mutation."},
                text=None,
            )
        )
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client),
        ):
            result = generate_sql("Remove all employees")
        self.assertFalse(result.success)
        self.assertFalse(result.validation.valid)
        self.assertEqual(result.generated_sql, "DELETE FROM employees")
        self.assertTrue(result.validation.validation_errors)

    def test_generated_identifiers_must_exist_in_inspected_schema(self) -> None:
        for query in (
            "SELECT invented_column FROM employees",
            "SELECT * FROM invented_table",
        ):
            with self.subTest(query=query):
                client = self.make_client(
                    SimpleNamespace(
                        parsed={"sql": query, "explanation": "A generated query."},
                        text=None,
                    )
                )
                with (
                    patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
                    patch("app.services.ai_sql_generation.genai.Client", return_value=client),
                ):
                    result = generate_sql("Query something")
                self.assertFalse(result.success)
                self.assertFalse(result.validation.valid)
                self.assertEqual(result.generated_sql, query)
                self.assertTrue(result.validation.validation_errors)

    def test_malformed_model_response_is_safe(self) -> None:
        client = self.make_client(SimpleNamespace(parsed=None, text="not-json"))
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client),
        ):
            result = generate_sql("Give me a query")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "Gemini returned a malformed SQL generation response.")

    def test_missing_api_key_does_not_call_schema_or_provider(self) -> None:
        with (
            patch("app.services.ai_sql_generation.settings.gemini_api_key", None),
            patch("app.services.ai_sql_generation.read_database_schema") as schema_reader,
            patch("app.services.ai_sql_generation.genai.Client") as client_factory,
        ):
            result = generate_sql("List employees")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "Gemini API key is not configured.")
        schema_reader.assert_not_called()
        client_factory.assert_not_called()

    def test_provider_failure_is_sanitized(self) -> None:
        client = MagicMock()
        client.models.generate_content.side_effect = RuntimeError(
            "provider failed with private request details"
        )
        with (
            patch("app.services.ai_sql_generation.read_database_schema", return_value=self.schema),
            patch("app.services.ai_sql_generation.genai.Client", return_value=client),
        ):
            result = generate_sql("List employees")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "Gemini SQL generation is temporarily unavailable.")
        self.assertNotIn("private request details", result.error or "")

    def test_rate_limit_and_timeout_errors_are_sanitized(self) -> None:
        for provider_error, expected in (
            (RuntimeError("request timed out"), "Gemini SQL generation is temporarily unavailable."),
            (TimeoutError("internal timeout details"), "Gemini request timed out."),
        ):
            with self.subTest(expected=expected):
                self.assertEqual(
                    generate_sql.__globals__["_provider_failure"](provider_error).error,
                    expected,
                )
        rate_limit = RuntimeError("rate limit")
        rate_limit.code = 429
        self.assertEqual(
            generate_sql.__globals__["_provider_failure"](rate_limit).error,
            "Gemini rate limit reached. Try again shortly.",
        )

    def test_schema_retrieval_failure_does_not_call_provider(self) -> None:
        with (
            patch(
                "app.services.ai_sql_generation.read_database_schema",
                side_effect=HTTPException(status_code=503),
            ),
            patch("app.services.ai_sql_generation.genai.Client") as client_factory,
        ):
            result = generate_sql("List employees")
        self.assertFalse(result.success)
        self.assertEqual(result.error, "Database schema is currently unavailable.")
        client_factory.assert_not_called()


if __name__ == "__main__":
    unittest.main()
