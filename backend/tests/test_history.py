"""History API lifecycle with controlled providers and database boundaries."""
import unittest
from unittest.mock import patch

from fastapi.testclient import TestClient
from app.main import app
from app.schemas.ai_generation import AIGenerationResponse, AIGenerationValidation
from app.schemas.sql_execution import SQLExecutionResponse


class HistoryRouteTests(unittest.TestCase):
    def setUp(self):
        self.client = TestClient(app)

    def test_generation_is_created_before_provider_and_error_is_sanitized(self):
        order = []
        def create(question):
            order.append('create')
            return 42
        def generate(question):
            order.append('generate')
            return AIGenerationResponse(success=False, validation=AIGenerationValidation(valid=False, message='private detail'), error='private detail')
        with patch('app.api.ai_generation.history.create', side_effect=create), patch('app.api.ai_generation.generate_sql', side_effect=generate), patch('app.api.ai_generation.history.update') as update:
            response = self.client.post('/api/ai/generate', json={'question': 'What happened?'})
        self.assertEqual(response.json()['history_id'], 42)
        self.assertEqual(order, ['create', 'generate'])
        self.assertEqual(update.call_args.kwargs['generation_error'], 'SQL generation failed.')
        self.assertNotIn('private detail', str(update.call_args))

    def test_revalidation_and_execution_record_latest_status_without_rows(self):
        with patch('app.api.sql_validation.history.update') as update:
            response = self.client.post('/api/sql/validate', json={'sql': 'DELETE FROM employees', 'history_id': 7})
        self.assertFalse(response.json()['valid'])
        self.assertEqual(update.call_args.kwargs['validation_status'], 'invalid')
        self.assertIsNone(update.call_args_list[0].kwargs['attempted_sql'])
        result = SQLExecutionResponse(success=True, rows=[{'secret': 'DO_NOT_STORE'}], columns=['secret'], row_count=1, execution_time_ms=12, truncated=True)
        with patch('app.api.sql_execution.history.update') as update, patch('app.api.sql_execution.execute_sql', return_value=result):
            response = self.client.post('/api/sql/execute', json={'sql': 'SELECT 1', 'history_id': 7})
        self.assertTrue(response.json()['success'])
        self.assertEqual(update.call_args.kwargs['row_count'], 1)
        self.assertNotIn('DO_NOT_STORE', str(update.call_args_list))
        self.assertEqual(update.call_args_list[0].kwargs['attempted_sql'], 'SELECT 1')
        with patch('app.api.sql_execution.history.update') as update, patch('app.api.sql_execution.execute_sql', return_value=SQLExecutionResponse(success=False, error='private driver detail')):
            self.client.post('/api/sql/execute', json={'sql': 'SELECT 2', 'history_id': 7})
        self.assertEqual(update.call_args.kwargs['execution_error'], 'Query execution failed.')
        self.assertIsNone(update.call_args.kwargs['row_count'])

    def test_unlinked_requests_delete_and_internal_table(self):
        with patch('app.api.sql_validation.history.update') as update:
            response = self.client.post('/api/sql/validate', json={'sql': 'SELECT 1'})
        self.assertTrue(response.json()['valid'])
        update.assert_not_called()
        with patch('app.api.history.history.delete') as delete:
            response = self.client.delete('/api/history/12')
        self.assertEqual(response.status_code, 204)
        delete.assert_called_once_with(12)
        response = self.client.post('/api/sql/validate', json={'sql': 'SELECT * FROM nl2sql_internal.query_history'})
        self.assertFalse(response.json()['valid'])
