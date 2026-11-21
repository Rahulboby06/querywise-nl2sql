import { useState } from 'react'
import Editor from '@monaco-editor/react'
import { AlertCircle, CheckCircle2, CircleHelp, Clock3, Database, LoaderCircle, Play, RefreshCw, ShieldCheck } from 'lucide-react'
import { executeSQL, validateSQL, type SQLExecutionResponse, type SQLValidation } from '../lib/assistant-api'

type AssistantPageProps = { theme: 'light' | 'dark' }

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function AssistantPage({ theme }: AssistantPageProps) {
  const [sql, setSql] = useState('')
  const [validatedSql, setValidatedSql] = useState('')
  const [validation, setValidation] = useState<SQLValidation | null>(null)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [execution, setExecution] = useState<SQLExecutionResponse | null>(null)
  const [executionError, setExecutionError] = useState('')

  const handleSQLChange = (value: string | undefined) => {
    const nextSql = value ?? ''
    setSql(nextSql)
    setExecution(null)
    setExecutionError('')
    setValidationError('')
    if (nextSql !== validatedSql) {
      setValidation({ valid: false, message: 'SQL changed. Validate the edited query before execution.', normalized_sql: null, validation_errors: [] })
    } else if (nextSql) {
      setValidation({ valid: true, message: 'This SQL passed backend validation.', normalized_sql: nextSql, validation_errors: [] })
    }
  }

  const handleValidate = async () => {
    if (!sql.trim() || isValidating) return
    setIsValidating(true)
    setValidationError('')
    setExecution(null)
    setExecutionError('')
    try {
      const result = await validateSQL(sql)
      setValidation(result)
      if (result.valid) {
        const normalized = result.normalized_sql ?? sql
        setSql(normalized)
        setValidatedSql(normalized)
      } else {
        setValidatedSql('')
      }
    } catch (error) {
      setValidatedSql('')
      setValidationError(error instanceof Error ? error.message : 'Could not validate this SQL.')
    } finally {
      setIsValidating(false)
    }
  }

  const handleExecute = async () => {
    if (!validation?.valid || validatedSql !== sql || isExecuting) return
    setExecution(null)
    setExecutionError('')
    setIsExecuting(true)
    try {
      const result = await executeSQL(sql, 100)
      if (!result.success) {
        setExecutionError(result.error || 'The query could not be executed.')
      } else {
        setExecution(result)
      }
    } catch (error) {
      setExecutionError(error instanceof Error ? error.message : 'The query could not be executed.')
    } finally {
      setIsExecuting(false)
    }
  }

  const canExecute = Boolean(validation?.valid && validatedSql === sql && sql.trim())
  const needsValidation = Boolean(sql.trim() && (sql !== validatedSql || !validation?.valid))

  return (
    <div className="assistant-page">
      <section aria-labelledby="sql-title" className="assistant-card generated-card">
        <h2 id="sql-title">Review and execute SQL</h2>
        <p>Enter a PostgreSQL query, validate it, then choose whether to run it.</p>
        <div className="assistant-editor-frame">
          <Editor
            height="300px"
            language="sql"
            onChange={handleSQLChange}
            options={{
              ariaLabel: 'PostgreSQL query editor',
              automaticLayout: true,
              fontSize: 13,
              lineNumbers: 'on',
              minimap: { enabled: false },
              padding: { top: 14, bottom: 14 },
              readOnly: isValidating || isExecuting,
              scrollBeyondLastLine: false,
              wordWrap: 'on',
            }}
            theme={theme === 'dark' ? 'vs-dark' : 'light'}
            value={sql}
          />
        </div>
        {validation && <p role="status">{validation.message}</p>}
        {validation && !validation.valid && validation.validation_errors.length > 0 && <div className="assistant-validation-errors" role="alert"><strong><AlertCircle aria-hidden="true" size={14} /> Validation feedback</strong><ul>{validation.validation_errors.map((error, index) => <li key={index}>{error}</li>)}</ul></div>}
        {validationError && <div className="assistant-alert assistant-alert-error" role="alert"><AlertCircle aria-hidden="true" size={15} />{validationError}</div>}
        <div className="assistant-execute-row">
          <div className="assistant-safety-copy"><ShieldCheck aria-hidden="true" size={15} /><span>Nothing runs until you approve it. The backend validates again before execution.</span></div>
          <div className="assistant-execution-actions">
            {needsValidation && <button className="assistant-secondary-button" disabled={isValidating || isExecuting} onClick={handleValidate} type="button">{isValidating ? <LoaderCircle aria-hidden="true" className="assistant-spinner" size={14} /> : <CheckCircle2 aria-hidden="true" size={14} />}{isValidating ? 'Validating...' : 'Validate SQL'}</button>}
            {canExecute && <button className="assistant-execute-button" disabled={isExecuting || isValidating} onClick={handleExecute} type="button">{isExecuting ? <LoaderCircle aria-hidden="true" className="assistant-spinner" size={15} /> : <Play aria-hidden="true" size={15} fill="currentColor" />}{isExecuting ? 'Executing...' : 'Execute query'}</button>}
          </div>
        </div>
      </section>

      {isExecuting && <section aria-live="polite" className="assistant-progress-card"><LoaderCircle aria-hidden="true" className="assistant-spinner" size={18} /><div><strong>Running approved query</strong><span>Waiting for read-only results from PostgreSQL.</span></div></section>}

      {executionError && <section aria-labelledby="execution-error-title" className="assistant-card assistant-results-card" role="alert"><div className="assistant-results-heading"><div className="assistant-card-title"><span className="assistant-result-icon assistant-result-icon-error"><AlertCircle aria-hidden="true" size={17} /></span><div><h3 id="execution-error-title">Query execution failed</h3><p>{executionError}</p></div></div><button className="assistant-tool-button" onClick={handleExecute} type="button"><RefreshCw aria-hidden="true" size={14} /> Try again</button></div></section>}

      {execution && (
        <section aria-labelledby="query-results-title" className="assistant-card assistant-results-card">
          <div className="assistant-results-heading">
            <div className="assistant-card-title"><span className="assistant-result-icon"><Database aria-hidden="true" size={16} /></span><div><h3 id="query-results-title">Query results</h3><p>Results returned by the configured PostgreSQL database.</p></div></div>
            <span className="assistant-success-badge"><CheckCircle2 aria-hidden="true" size={14} /> Executed</span>
          </div>
          <div className="assistant-result-metrics"><span><strong>{execution.row_count}</strong> rows</span><span><Clock3 aria-hidden="true" size={13} /> {execution.execution_time_ms.toFixed(1)} ms</span>{execution.truncated && <span className="assistant-truncated-badge"><CircleHelp aria-hidden="true" size={13} /> Results limited to 100 rows</span>}</div>
          {execution.row_count === 0 || execution.columns.length === 0 ? (
            <div className="assistant-empty-results"><Database aria-hidden="true" size={19} /><strong>No rows returned</strong><span>The query completed successfully but did not match any rows.</span></div>
          ) : (
            <div className="assistant-results-table-wrap"><table className="assistant-results-table"><thead><tr>{execution.columns.map((column) => <th key={column} scope="col">{column}</th>)}</tr></thead><tbody>{execution.rows.map((row, index) => <tr key={`row-${index}`}>{execution.columns.map((column) => <td key={`${index}-${column}`}>{displayValue(row[column])}</td>)}</tr>)}</tbody></table></div>
          )}
          <div className="assistant-results-footer"><span>Actual database results</span><span>{execution.truncated ? 'More rows may be available' : 'All returned rows shown'}</span></div>
        </section>
      )}

      <p className="assistant-page-footnote"><ShieldCheck aria-hidden="true" size={13} /> SQL is validated and executed by the backend in a read-only transaction.</p>
    </div>
  )
}
