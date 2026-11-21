"""Unit tests for the validated read-only SQL execution service."""

import unittest
from datetime import date, datetime, timezone
from decimal import Decimal
from types import SimpleNamespace
from unittest.mock import MagicMock, patch
from uuid import UUID

from sqlalchemy.exc import DBAPIError

from app.schemas.sql_execution import SQLExecutionRequest
from app.services.sql_execution import execute_sql


def make_connection(rows: list[dict[str, object]], columns: list[str] | None = None):
    connection = MagicMock()
    connection.__enter__.return_value = connection
    connection.begin.return_value.__enter__.return_value = None
    result = MagicMock()
    result.keys.return_value = columns or (list(rows[0]) if rows else [])
    result.mappings.return_value.fetchmany.return_value = rows
    connection.execute.return_value = result
    return connection


class SQLExecutionTests(unittest.TestCase):
    def test_select_join_and_aggregate_are_executed_read_only(self) -> None:
        for query in (
            "SELECT * FROM employees",
            "SELECT e.employee_id, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id",
            "SELECT department_id, COUNT(*) FROM employees GROUP BY department_id",
        ):
            with self.subTest(query=query):
                connection = make_connection([{"value": 1}], ["value"])
                with patch("app.services.sql_execution.engine.connect") as connect:
                    connect.return_value.__enter__.return_value = connection
                    response = execute_sql(query)
                self.assertTrue(response.success, response.error)
                self.assertEqual(response.rows, [{"value": 1}])
                connection.exec_driver_sql.assert_called_once_with(
                    "SET TRANSACTION READ ONLY"
                )
                self.assertEqual(connection.execute.call_count, 2)

    def test_empty_result_and_limit_truncation(self) -> None:
        empty_connection = make_connection([], [])
        with patch("app.services.sql_execution.engine.connect") as connect:
            connect.return_value.__enter__.return_value = empty_connection
            empty = execute_sql("SELECT employee_id FROM employees")
        self.assertTrue(empty.success)
        self.assertEqual(empty.row_count, 0)
        self.assertFalse(empty.truncated)

        connection = make_connection([{"id": 1}, {"id": 2}, {"id": 3}])
        with patch("app.services.sql_execution.engine.connect") as connect:
            connect.return_value.__enter__.return_value = connection
            limited = execute_sql("SELECT employee_id AS id FROM employees", limit=2)
        self.assertEqual(limited.rows, [{"id": 1}, {"id": 2}])
        self.assertEqual(limited.row_count, 2)
        self.assertTrue(limited.truncated)
        executed_query = connection.execute.call_args_list[-1]
        self.assertEqual(executed_query.args[1], {"_nl2sql_limit": 3})

    def test_invalid_mutation_and_multiple_statements_never_reach_database(self) -> None:
        for query in (
            "not valid SQL",
            "DELETE FROM employees",
            "SELECT 1; SELECT 2",
        ):
            with self.subTest(query=query):
                with patch("app.services.sql_execution.engine.connect") as connect:
                    response = execute_sql(query)
                self.assertFalse(response.success)
                self.assertIsNotNone(response.error)
                connect.assert_not_called()

    def test_database_values_are_json_compatible(self) -> None:
        row = {
            "amount": Decimal("12.50"),
            "date": date(2025, 1, 2),
            "created": datetime(2025, 1, 2, tzinfo=timezone.utc),
            "uuid": UUID("12345678-1234-5678-1234-567812345678"),
            "nullable": None,
        }
        connection = make_connection([row])
        with patch("app.services.sql_execution.engine.connect") as connect:
            connect.return_value.__enter__.return_value = connection
            response = execute_sql("SELECT 1")
        self.assertTrue(response.success)
        self.assertEqual(response.rows[0]["amount"], 12.5)
        self.assertEqual(response.rows[0]["date"], "2025-01-02")
        self.assertEqual(response.rows[0]["created"], "2025-01-02T00:00:00+00:00")
        self.assertEqual(response.rows[0]["uuid"], str(row["uuid"]))
        self.assertIsNone(response.rows[0]["nullable"])

    def test_timeout_is_reported_without_driver_details(self) -> None:
        connection = MagicMock()
        connection.__enter__.return_value = connection
        connection.begin.return_value.__enter__.return_value = None
        connection.execute.side_effect = [
            MagicMock(),
            DBAPIError("query", {}, SimpleNamespace(sqlstate="57014"), False),
        ]
        with patch("app.services.sql_execution.engine.connect") as connect:
            connect.return_value.__enter__.return_value = connection
            response = execute_sql("SELECT 1")
        self.assertFalse(response.success)
        self.assertEqual(response.error, "Query execution timed out.")
        self.assertNotIn("57014", response.error)

    def test_request_limits_are_server_bounded(self) -> None:
        self.assertEqual(SQLExecutionRequest(sql="SELECT 1").limit, 100)
        self.assertEqual(SQLExecutionRequest(sql="SELECT 1", limit=1000).limit, 1000)
        with self.assertRaises(ValueError):
            SQLExecutionRequest(sql="SELECT 1", limit=1001)
        with self.assertRaises(ValueError):
            SQLExecutionRequest(sql="SELECT 1", timeout_ms=1)


if __name__ == "__main__":
    unittest.main()
