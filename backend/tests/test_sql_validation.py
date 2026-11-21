"""Unit tests for the SQLGlot read-only SQL validator."""

import unittest

from app.services.sql_validation import validate_sql


class SQLValidationTests(unittest.TestCase):
    def test_allowed_queries(self) -> None:
        queries = (
            "SELECT * FROM employees",
            "SELECT e.employee_id, d.department_name FROM employees e JOIN departments d ON e.department_id = d.department_id",
            "SELECT department_id, COUNT(*) FROM employees GROUP BY department_id HAVING COUNT(*) > 1 ORDER BY department_id",
            "WITH active_employees AS (SELECT employee_id FROM employees) SELECT employee_id FROM active_employees",
            "SELECT employee_id FROM employees WHERE department_id IN (SELECT department_id FROM departments)",
            "SELECT department_id, AVG(salary) FROM employees GROUP BY department_id",
        )
        for query in queries:
            with self.subTest(query=query):
                result = validate_sql(query)
                self.assertTrue(result.valid, result.validation_errors)
                self.assertIsNotNone(result.normalized_sql)
                self.assertEqual(result.validation_errors, [])

    def test_rejected_queries(self) -> None:
        queries = (
            "SELECT FROM employees",
            "INSERT INTO employees (first_name) VALUES ('A')",
            "UPDATE employees SET salary = 1",
            "DELETE FROM employees",
            "DROP TABLE employees",
            "ALTER TABLE employees ADD COLUMN x integer",
            "CREATE TABLE x (id integer)",
            "TRUNCATE employees",
            "SELECT 1; SELECT 2",
            "SELECT * INTO copied_employees FROM employees",
            "WITH removed AS (DELETE FROM employees RETURNING *) SELECT * FROM removed",
            "SELECT * FROM employees FOR UPDATE",
            "SELECT nextval('employee_seq')",
            "SELECT set_config('statement_timeout', '0', false)",
            "SELECT pg_advisory_lock(1)",
        )
        for query in queries:
            with self.subTest(query=query):
                result = validate_sql(query)
                self.assertFalse(result.valid)
                self.assertIsNone(result.normalized_sql)
                self.assertTrue(result.validation_errors)

    def test_empty_query_is_rejected(self) -> None:
        result = validate_sql("   ")
        self.assertFalse(result.valid)
        self.assertTrue(result.validation_errors)


if __name__ == "__main__":
    unittest.main()
