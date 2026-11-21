import { API_BASE_URL } from './schema-api'

export type SQLValidation = {
  valid: boolean
  message: string
  normalized_sql: string | null
  validation_errors: string[]
}

export type AIGenerationRequest = { question: string }

export type AIGenerationResponse = {
  success: boolean
  history_id: number
  generated_sql: string | null
  explanation: string
  tables_used: string[]
  validation: SQLValidation
  error: string | null
}

export type SQLValidationRequest = { sql: string; history_id?: number }

export type SQLExecutionRequest = {
  sql: string
  limit: number
  history_id?: number
}

export type SQLExecutionResponse = {
  success: boolean
  columns: string[]
  rows: Record<string, unknown>[]
  row_count: number
  execution_time_ms: number
  truncated: boolean
  error: string | null
}

async function postJson<TRequest, TResponse>(path: string, request: TRequest): Promise<TResponse> {
  let response: Response
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers: { Accept: 'application/json', 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    })
  } catch {
    throw new Error('Could not reach the backend. Check that the API server is running and try again.')
  }

  const payload: unknown = await response.json().catch(() => null)
  if (!response.ok) {
    const detail = typeof payload === 'object' && payload !== null && 'detail' in payload
      ? (payload as { detail?: unknown }).detail
      : null
    const message = typeof detail === 'string' ? detail : `The backend request failed (HTTP ${response.status}).`
    throw new Error(message)
  }

  return payload as TResponse
}

export function generateSQL(question: string): Promise<AIGenerationResponse> {
  return postJson('/api/ai/generate', { question })
}

export function validateSQL(sql: string, historyId?: number): Promise<SQLValidation> {
  return postJson('/api/sql/validate', { sql, history_id: historyId })
}

export function executeSQL(sql: string, limit = 100, historyId?: number): Promise<SQLExecutionResponse> {
  return postJson('/api/sql/execute', { sql, limit, history_id: historyId })
}
