export type DatabaseColumn = {
  name: string
  data_type: string
  nullable: boolean
  default: string | null
}

export type DatabaseForeignKey = {
  name: string | null
  columns: string[]
  referred_schema: string | null
  referred_table: string
  referred_columns: string[]
  options: Record<string, unknown>
}

export type DatabaseIndex = {
  name: string
  columns: (string | null)[]
  unique: boolean
  dialect_options: Record<string, unknown>
  duplicates_constraint: string | null
}

export type DatabaseTable = {
  name: string
  columns: DatabaseColumn[]
  primary_key: { name: string | null; columns: string[] }
  foreign_keys: DatabaseForeignKey[]
  unique_constraints: { name: string | null; columns: string[] }[]
  check_constraints: { name: string | null; expression: string }[]
  indexes: DatabaseIndex[]
}

export type DatabaseSchema = {
  database: { name: string; engine: string; version: string }
  tables: DatabaseTable[]
}

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL?.trim()
export const API_BASE_URL = (configuredBaseUrl || 'http://127.0.0.1:8001').replace(/\/+$/, '')

export async function fetchDatabaseSchema(): Promise<DatabaseSchema> {
  const response = await fetch(`${API_BASE_URL}/api/schema`, {
    headers: { Accept: 'application/json' },
  })

  if (!response.ok) {
    throw new Error(`Schema request failed with status ${response.status}`)
  }

  return (await response.json()) as DatabaseSchema
}
