import { API_BASE_URL } from './schema-api'

export type HistoryEntry = {
  id: number; question: string; generated_sql: string | null; validated_sql: string | null; attempted_sql: string | null
  generation_status: string; generation_error: string | null; validation_status: string; validation_error: string | null
  execution_status: string; execution_error: string | null; execution_duration_ms: number | null
  row_count: number | null; truncated: boolean | null; created_at: string; updated_at: string
}
export type HistoryList = { items: HistoryEntry[]; total: number; limit: number; offset: number }
async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let response: Response
  try { response = await fetch(`${API_BASE_URL}${path}`, options) }
  catch { throw new Error('Could not reach the backend. Check the connection and try again.') }
  if (!response.ok) throw new Error(response.status === 404 ? 'This history entry no longer exists.' : 'Query history is unavailable. Please try again.')
  if (response.status === 204) return undefined as T
  return response.json() as Promise<T>
}
export const fetchHistory = (offset: number, limit = 20) => request<HistoryList>(`/api/history?offset=${offset}&limit=${limit}`)
export const fetchHistoryEntry = (id: number) => request<HistoryEntry>(`/api/history/${id}`)
export const deleteHistoryEntry = (id: number) => request<void>(`/api/history/${id}`, { method: 'DELETE' })
