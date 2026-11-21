import { useEffect, useState } from 'react'
import Editor from '@monaco-editor/react'
import {
  AlertCircle,
  Check,
  CheckCircle2,
  CircleHelp,
  Clock3,
  Copy,
  Database,
  Edit3,
  LoaderCircle,
  LockKeyhole,
  Play,
  RefreshCw,
  RotateCcw,
  Send,
  ShieldCheck,
  Sparkles,
  Table2,
  UnlockKeyhole,
  XCircle,
} from 'lucide-react'
import { executeSQL, generateSQL, validateSQL, type SQLExecutionResponse, type SQLValidation } from '../lib/assistant-api'
import { fetchDatabaseSchema, type DatabaseSchema } from '../lib/schema-api'
import { configureEditorThemes } from '../lib/editor-theme'
import './AssistantPage.css'

type AssistantPageProps = { theme: 'light' | 'dark' }
type ConnectionStatus = 'checking' | 'connected' | 'unavailable'

const questionExamples = [
  'Show the top 5 highest-paid employees with their department names.',
  'Calculate average salary by department.',
  'Find the top 10 products by revenue.',
]

function displayValue(value: unknown): string {
  if (value === null || value === undefined) return 'NULL'
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

export function AssistantPage({ theme }: AssistantPageProps) {
  const [historyId, setHistoryId] = useState<number | undefined>()
  const [question, setQuestion] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generationError, setGenerationError] = useState('')
  const [sql, setSql] = useState('')
  const [validatedSql, setValidatedSql] = useState('')
  const [validation, setValidation] = useState<SQLValidation | null>(null)
  const [explanation, setExplanation] = useState('')
  const [tablesUsed, setTablesUsed] = useState<string[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [validationError, setValidationError] = useState('')
  const [isExecuting, setIsExecuting] = useState(false)
  const [execution, setExecution] = useState<SQLExecutionResponse | null>(null)
  const [executionError, setExecutionError] = useState('')
  const [copied, setCopied] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('checking')
  const [database, setDatabase] = useState<DatabaseSchema['database'] | null>(null)

  useEffect(() => {
    let current = true
    fetchDatabaseSchema()
      .then((schema) => {
        if (!current) return
        setDatabase(schema.database)
        setConnectionStatus('connected')
      })
      .catch(() => {
        if (!current) return
        setDatabase(null)
        setConnectionStatus('unavailable')
      })
    return () => { current = false }
  }, [])

  const clearGenerated = () => {
    setHistoryId(undefined)
    setSql('')
    setValidatedSql('')
    setValidation(null)
    setExplanation('')
    setTablesUsed([])
    setValidationError('')
    setExecution(null)
    setExecutionError('')
    setIsEditing(false)
  }

  const handleGenerate = async () => {
    const cleanQuestion = question.trim()
    if (!cleanQuestion || isGenerating) return
    clearGenerated()
    setGenerationError('')
    setIsGenerating(true)
    try {
      const result = await generateSQL(cleanQuestion)
      setHistoryId(result.history_id)
      setExplanation(result.explanation)
      setTablesUsed(result.tables_used)
      setValidation(result.validation)
      if (result.generated_sql) {
        setSql(result.generated_sql)
        setValidatedSql(result.validation.valid ? result.generated_sql : '')
      }
      if (!result.success) {
        setGenerationError(result.error || result.validation.message || 'SQL generation was unsuccessful.')
      }
    } catch (error) {
      setGenerationError(error instanceof Error ? error.message : 'SQL generation failed. Please try again.')
    } finally {
      setIsGenerating(false)
    }
  }

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
      const result = await validateSQL(sql, historyId)
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
      const result = await executeSQL(sql, 100, historyId)
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

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(sql)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 1800)
    } catch {
      setCopied(false)
      setGenerationError('Could not copy SQL to the clipboard. Check browser clipboard permissions.')
    }
  }

  const canExecute = Boolean(validation?.valid && validatedSql === sql && sql.trim())
  const needsValidation = Boolean(sql.trim() && (sql !== validatedSql || !validation?.valid))

  return (
    <div className="assistant-page">
      <section className="assistant-intro">
        <div className="assistant-title-copy">
          <span className="assistant-eyebrow"><Sparkles aria-hidden="true" size={13} /> NATURAL LANGUAGE TO SQL</span>
          <h2>Ask your data a question</h2>
          <p>Describe what you want to learn. Review the generated PostgreSQL, then choose whether to run it.</p>
        </div>
        <div className={`assistant-connection assistant-connection-${connectionStatus}`} aria-live="polite">
          <span className="assistant-connection-dot" />
          {connectionStatus === 'checking' ? 'Checking database' : connectionStatus === 'connected' ? `Connected${database ? ` · ${database.name}` : ''}` : 'Database unavailable'}
        </div>
      </section>

      <section aria-labelledby="question-title" className="assistant-card question-card">
        <div className="assistant-card-heading">
          <div className="assistant-card-title"><span className="assistant-step">1</span><div><h3 id="question-title">Your question</h3><p>Ask in plain language using the available database schema.</p></div></div>
          <span className="assistant-private-note"><ShieldCheck aria-hidden="true" size={14} /> Read-only workflow</span>
        </div>
        <label className="assistant-question-label" htmlFor="assistant-question">Natural-language question</label>
        <textarea
          aria-describedby="question-examples"
          className="assistant-question-input"
          id="assistant-question"
          maxLength={4000}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="e.g. Show the top 5 highest-paid employees with their department names."
          value={question}
        />
        <div className="assistant-question-footer">
          <div className="assistant-example-row" id="question-examples">
            <span>Try:</span>
            {questionExamples.map((example) => (
              <button className="assistant-example-chip" key={example} onClick={() => setQuestion(example)} type="button">{example}</button>
            ))}
          </div>
          <span className="assistant-character-count">{question.length}/4000</span>
        </div>
        <div className="assistant-form-actions">
          <button className="assistant-secondary-button" disabled={isGenerating || isValidating || isExecuting} onClick={() => { clearGenerated(); setGenerationError(''); setIsEditing(true) }} type="button">Write SQL manually</button>
          {question.trim() && <button className="assistant-text-button" onClick={() => { setQuestion(''); setGenerationError(''); clearGenerated() }} type="button"><RotateCcw aria-hidden="true" size={14} /> Clear</button>}
          <button className="assistant-primary-button" disabled={!question.trim() || isGenerating} onClick={handleGenerate} type="button">
            {isGenerating ? <LoaderCircle aria-hidden="true" className="assistant-spinner" size={15} /> : <Sparkles aria-hidden="true" size={15} />}
            {isGenerating ? 'Generating SQL…' : sql ? 'Regenerate SQL' : 'Generate SQL'}
            {!isGenerating && <Send aria-hidden="true" size={14} />}
          </button>
        </div>
        {generationError && <div className="assistant-alert assistant-alert-error" role="alert"><AlertCircle aria-hidden="true" size={16} /><span>{generationError}</span></div>}
      </section>

      {isGenerating && (
        <section aria-live="polite" className="assistant-progress-card"><LoaderCircle aria-hidden="true" className="assistant-spinner" size={18} /><div><strong>Generating your SQL</strong><span>Gemini is matching your question to the live database schema.</span></div></section>
      )}

      {(sql || isEditing || (validation && !validation.valid)) && (
        <section aria-labelledby="generated-sql-title" className="assistant-card generated-card">
          <div className="assistant-card-heading assistant-generated-heading">
            <div className="assistant-card-title"><span className="assistant-step">2</span><div><h3 id="generated-sql-title">Review SQL</h3><p>Inspect the query before optionally running it against PostgreSQL.</p></div></div>
            <div className="assistant-sql-toolbar">
              {sql && <button className="assistant-tool-button" onClick={handleCopy} type="button"><Check aria-hidden="true" size={14} /> {copied ? 'Copied' : <><Copy aria-hidden="true" size={14} /> Copy</>}</button>}
              {sql && <button className="assistant-tool-button" disabled={isValidating || isExecuting} onClick={() => setIsEditing((current) => !current)} type="button">{isEditing ? <><LockKeyhole aria-hidden="true" size={14} /> Lock</> : <><Edit3 aria-hidden="true" size={14} /> Edit SQL</>}</button>}
              {validation?.valid && !needsValidation && <span className="assistant-valid-badge"><CheckCircle2 aria-hidden="true" size={14} /> Valid SQL</span>}
              {validation && !validation.valid && <span className="assistant-invalid-badge"><XCircle aria-hidden="true" size={14} /> Needs review</span>}
            </div>
          </div>

          {(sql || isEditing) ? (
            <div className="assistant-editor-frame">
              <div className="assistant-editor-topline"><span><span className="assistant-editor-dot" /> query.sql</span><span>{isEditing ? <><UnlockKeyhole aria-hidden="true" size={12} /> Editable</> : <><LockKeyhole aria-hidden="true" size={12} /> Read-only</>}</span></div>
              <Editor
                beforeMount={configureEditorThemes}
                height="300px"
                language="sql"
                onChange={handleSQLChange}
                options={{
                  ariaLabel: 'Generated PostgreSQL query editor',
                  automaticLayout: true,
                  fontFamily: 'var(--font-mono)',
                  fontSize: 13,
                  lineNumbers: 'on',
                  minimap: { enabled: false },
                  padding: { top: 14, bottom: 14 },
                  readOnly: !isEditing || isValidating || isExecuting,
                  scrollBeyondLastLine: false,
                  wordWrap: 'on',
                }}
                theme={`nl2sql-${theme}`}
                value={sql}
              />
            </div>
          ) : (
            <div className="assistant-no-sql"><AlertCircle aria-hidden="true" size={16} /><span>{generationError || validation?.message || 'The response did not include a query.'}</span></div>
          )}

          {explanation && <div className="assistant-explanation"><span className="assistant-explanation-icon"><Sparkles aria-hidden="true" size={14} /></span><div><strong>Explanation</strong><p>{explanation}</p></div></div>}
          {tablesUsed.length > 0 && <div className="assistant-tables-used"><span className="assistant-meta-label"><Table2 aria-hidden="true" size={13} /> Tables used</span><div>{tablesUsed.map((table) => <span className="assistant-table-pill" key={table}>{table}</span>)}</div></div>}
          {validation && !validation.valid && validation.validation_errors.length > 0 && <div className="assistant-validation-errors" role="alert"><strong><AlertCircle aria-hidden="true" size={14} /> Validation feedback</strong><ul>{validation.validation_errors.map((error, index) => <li key={`${index}-${error}`}>{error}</li>)}</ul></div>}
          {validationError && <div className="assistant-alert assistant-alert-error" role="alert"><AlertCircle aria-hidden="true" size={15} />{validationError}</div>}

          <div className="assistant-execute-row">
            <div className="assistant-safety-copy"><ShieldCheck aria-hidden="true" size={15} /><span>Nothing runs until you approve it. The backend validates again before execution.</span></div>
            <div className="assistant-execution-actions">
              {needsValidation && <button className="assistant-secondary-button" disabled={isValidating || isExecuting} onClick={handleValidate} type="button">{isValidating ? <LoaderCircle aria-hidden="true" className="assistant-spinner" size={14} /> : <CheckCircle2 aria-hidden="true" size={14} />}{isValidating ? 'Validating…' : 'Validate SQL'}</button>}
              {canExecute && <button className="assistant-execute-button" disabled={isExecuting || isValidating} onClick={handleExecute} type="button">{isExecuting ? <LoaderCircle aria-hidden="true" className="assistant-spinner" size={15} /> : <Play aria-hidden="true" size={15} fill="currentColor" />}{isExecuting ? 'Executing…' : 'Execute query'}</button>}
            </div>
          </div>
        </section>
      )}

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
