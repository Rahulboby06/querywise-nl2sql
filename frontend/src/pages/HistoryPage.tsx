import { useCallback, useEffect, useState } from 'react'
import { deleteHistoryEntry, fetchHistory, fetchHistoryEntry, type HistoryEntry, type HistoryList } from '../lib/history-api'
import './AccountHistory.css'

const PAGE_SIZE = 20
function outcome(entry: HistoryEntry): string {
  if (entry.execution_status !== 'not_started') return `Execution ${entry.execution_status}`
  if (entry.validation_status === 'invalid' || entry.validation_status === 'failed') return `Validation ${entry.validation_status}`
  if (entry.generation_status === 'pending') return 'Generation pending'
  if (entry.generation_status === 'failed') return 'Generation failed'
  return 'Generated'
}
export function HistoryPage() {
  const [page, setPage] = useState(0)
  const [data, setData] = useState<HistoryList | null>(null)
  const [selected, setSelected] = useState<HistoryEntry | null>(null)
  const [loading, setLoading] = useState(true)
  const [detailLoading, setDetailLoading] = useState(false)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [error, setError] = useState('')
  const [detailError, setDetailError] = useState('')
  const load = useCallback(async (signal?: { cancelled: boolean }) => {
    try { const result = await fetchHistory(page * PAGE_SIZE); if (!signal?.cancelled) setData(result) }
    catch (err) { if (!signal?.cancelled) setError(err instanceof Error ? err.message : 'Could not load history.') }
    finally { if (!signal?.cancelled) setLoading(false) }
  }, [page])
  useEffect(() => {
    const signal = { cancelled: false }
    void Promise.resolve().then(() => { if (!signal.cancelled) return load(signal) })
    return () => { signal.cancelled = true }
  }, [load])
  function changePage(next: number) { setLoading(true); setError(''); setPage(next) }
  function retry() { setLoading(true); setError(''); void load() }
  async function open(id: number) {
    setDetailLoading(true); setDetailError(''); setSelected(null)
    try { setSelected(await fetchHistoryEntry(id)) }
    catch (err) { setDetailError(err instanceof Error ? err.message : 'Could not load this entry.') }
    finally { setDetailLoading(false) }
  }
  async function remove(entry: HistoryEntry) {
    if (!window.confirm('Permanently delete this history entry?')) return
    setBusyId(entry.id); setError('')
    try {
      await deleteHistoryEntry(entry.id)
      setData(current => current ? {...current, items: current.items.filter(item => item.id !== entry.id), total: current.total - 1} : current)
      setSelected(current => current?.id === entry.id ? null : current)
      if (data?.items.length === 1 && page > 0) changePage(page - 1)
    } catch (err) { setError(err instanceof Error ? err.message : 'Could not delete this entry.') }
    finally { setBusyId(null) }
  }
  return <section className="account-page" aria-labelledby="history-heading">
    <div className="account-heading"><h2 id="history-heading">Query history</h2><p>Review your assistant generation attempts and their latest validation and execution results.</p></div>
    {error && <p className="account-error" role="alert">{error} <button type="button" className="account-link" onClick={retry}>Retry</button></p>}
    {loading ? <p role="status">Loading history...</p> : data?.items.length === 0 && page === 0 ? <div className="account-panel">No query history yet. Ask a question in the AI SQL Assistant to get started.</div> : data && <>
      <div className="history-list account-panel">{data.items.map(entry => <article className="history-row" key={entry.id}>
        <button className="history-open" type="button" onClick={() => void open(entry.id)}><strong>{entry.question}</strong><span>{new Date(entry.created_at).toLocaleString()} · {outcome(entry)}</span></button>
        <button className="account-button" type="button" disabled={busyId !== null || detailLoading} onClick={() => void remove(entry)} aria-label={`Delete history entry: ${entry.question}`}>{busyId === entry.id ? 'Deleting...' : 'Delete'}</button>
      </article>)}</div>
      <div className="history-pagination"><button className="account-button" disabled={page === 0} onClick={() => changePage(page - 1)} type="button">Previous</button><span>Page {page + 1} · {data.total} entries</span><button className="account-button" disabled={(page + 1) * PAGE_SIZE >= data.total} onClick={() => changePage(page + 1)} type="button">Next</button></div>
    </>}
    {detailLoading && <p role="status">Loading entry...</p>}{detailError && <p className="account-error" role="alert">{detailError}</p>}
    {selected && <section className="account-panel history-detail" aria-labelledby="history-detail-title">
      <div className="history-detail-heading"><h3 id="history-detail-title">Entry details</h3><button className="account-button" onClick={() => setSelected(null)} type="button">Close</button></div>
      <p><strong>Question:</strong> {selected.question}</p><p><strong>Created:</strong> {new Date(selected.created_at).toLocaleString()}</p><p><strong>Updated:</strong> {new Date(selected.updated_at).toLocaleString()}</p>
      <dl><div><dt>Generation</dt><dd>{selected.generation_status}{selected.generation_error && ` — ${selected.generation_error}`}</dd></div><div><dt>Validation</dt><dd>{selected.validation_status}{selected.validation_error && ` — ${selected.validation_error}`}</dd></div><div><dt>Execution</dt><dd>{selected.execution_status}{selected.execution_error && ` — ${selected.execution_error}`}</dd></div></dl>
      {selected.generated_sql && <><h4>Original generated SQL</h4><pre>{selected.generated_sql}</pre></>}
      {selected.validated_sql && selected.validated_sql !== selected.generated_sql && <><h4>Last validated SQL</h4><pre>{selected.validated_sql}</pre></>}
      {selected.attempted_sql && selected.attempted_sql !== selected.generated_sql && <><h4>SQL attempted</h4><pre>{selected.attempted_sql}</pre></>}
      {selected.execution_duration_ms !== null && <p><strong>Duration:</strong> {selected.execution_duration_ms.toFixed(1)} ms</p>}
      {selected.row_count !== null && <p><strong>Rows returned:</strong> {selected.row_count}{selected.truncated ? ' (truncated)' : ''}</p>}
      <button className="account-button" type="button" disabled={busyId !== null} onClick={() => void remove(selected)}>Delete entry</button>
    </section>}
  </section>
}
