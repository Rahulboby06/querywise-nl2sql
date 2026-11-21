import { useEffect, useMemo, useState } from 'react'
import {
  AlertCircle,
  ArrowRight,
  Check,
  ChevronRight,
  CircleHelp,
  Database,
  KeyRound,
  Link2,
  LoaderCircle,
  RefreshCw,
  Search,
  Table2,
} from 'lucide-react'
import { fetchDatabaseSchema, type DatabaseSchema, type DatabaseTable } from '../lib/schema-api'

type LoadState = 'loading' | 'loaded' | 'error'

function columnConstraints(table: DatabaseTable, columnName: string): { label: string; kind: 'primary' | 'foreign' | 'other' }[] {
  const labels: { label: string; kind: 'primary' | 'foreign' | 'other' }[] = []
  if (table.primary_key.columns.includes(columnName)) {
    labels.push({ label: 'Primary key', kind: 'primary' })
  }
  for (const foreignKey of table.foreign_keys) {
    const index = foreignKey.columns.indexOf(columnName)
    if (index !== -1) {
      const target = `${foreignKey.referred_table}.${foreignKey.referred_columns[index] ?? ''}`
      const onDelete = foreignKey.options.ondelete ? ` · ON DELETE ${String(foreignKey.options.ondelete)}` : ''
      labels.push({ label: `Foreign key → ${target}${onDelete}`, kind: 'foreign' })
    }
  }
  for (const constraint of table.unique_constraints) {
    if (constraint.columns.includes(columnName)) {
      labels.push({
        label: constraint.columns.length > 1 ? `Unique (${constraint.columns.join(', ')})` : 'Unique',
        kind: 'other',
      })
    }
  }
  for (const constraint of table.check_constraints) {
    if (constraint.expression.toLowerCase().includes(columnName.toLowerCase())) {
      labels.push({ label: `CHECK ${constraint.expression}`, kind: 'other' })
    }
  }
  return labels
}

export function DatabaseExplorerPage() {
  const [schema, setSchema] = useState<DatabaseSchema | null>(null)
  const [loadState, setLoadState] = useState<LoadState>('loading')
  const [search, setSearch] = useState('')
  const [selectedName, setSelectedName] = useState('')
  const [retryToken, setRetryToken] = useState(0)

  useEffect(() => {
    let isCurrentRequest = true
    setLoadState('loading')

    fetchDatabaseSchema()
      .then((result) => {
        if (!isCurrentRequest) return
        setSchema(result)
        setSelectedName((current) => result.tables.some((table) => table.name === current)
          ? current
          : result.tables[0]?.name ?? '')
        setLoadState('loaded')
      })
      .catch(() => {
        if (!isCurrentRequest) return
        setSchema(null)
        setLoadState('error')
      })

    return () => { isCurrentRequest = false }
  }, [retryToken])

  const tables = schema?.tables ?? []
  const filteredTables = useMemo(
    () => tables.filter(({ name }) => name.toLowerCase().includes(search.trim().toLowerCase())),
    [search, tables],
  )
  const selectedTable = tables.find(({ name }) => name === selectedName) ?? null
  const relationships = tables.flatMap((table) => table.foreign_keys.map((foreignKey) => ({
    key: `${table.name}.${foreignKey.columns.join(',')}`,
    fromTable: table.name,
    fromColumns: foreignKey.columns,
    toTable: foreignKey.referred_table,
    toColumns: foreignKey.referred_columns,
    onDelete: foreignKey.options.ondelete,
  })))

  const retry = () => setRetryToken((current) => current + 1)

  if (loadState === 'loading') {
    return (
      <section aria-live="polite" className="schema-state-panel">
        <span className="schema-state-icon"><LoaderCircle aria-hidden="true" className="schema-loader" size={22} /></span>
        <h2>Loading database schema</h2>
        <p>Connecting to the backend to retrieve current database metadata.</p>
      </section>
    )
  }

  if (loadState === 'error') {
    return (
      <section aria-live="assertive" className="schema-state-panel schema-error-panel">
        <span className="schema-state-icon"><AlertCircle aria-hidden="true" size={22} /></span>
        <h2>Could not load database schema</h2>
        <p>The backend is unavailable or could not return schema metadata. Check the backend connection and try again.</p>
        <button className="schema-retry-button" onClick={retry} type="button"><RefreshCw aria-hidden="true" size={14} /> Retry</button>
      </section>
    )
  }

  if (!schema || tables.length === 0) {
    return (
      <section aria-live="polite" className="schema-state-panel schema-empty-panel">
        <span className="schema-state-icon"><Database aria-hidden="true" size={22} /></span>
        <h2>No database tables found</h2>
        <p>The backend returned schema metadata without any tables.</p>
        <button className="schema-retry-button" onClick={retry} type="button"><RefreshCw aria-hidden="true" size={14} /> Refresh schema</button>
      </section>
    )
  }

  return (
    <div className="explorer-page">
      <section aria-labelledby="explorer-overview-title" className="explorer-overview">
        <div className="explorer-overview-heading">
          <span className="explorer-database-icon"><Database aria-hidden="true" size={19} /></span>
          <div><h2 id="explorer-overview-title">{schema.database.name}</h2><p>Live metadata from the configured database</p></div>
          <span className="local-info-badge"><span /> Connected</span>
        </div>
        <div className="explorer-overview-stats">
          <div><span>Engine</span><strong>{schema.database.engine}</strong></div>
          <div><span>Version</span><strong>{schema.database.version}</strong></div>
          <div><span>Tables</span><strong>{tables.length}</strong></div>
        </div>
        <p className="explorer-data-note"><CircleHelp aria-hidden="true" size={13} /> Schema details are retrieved live from the read-only schema API.</p>
      </section>

      <div className="explorer-content-grid">
        <aside aria-label="Database tables" className="explorer-table-panel">
          <div className="explorer-panel-heading"><div><h2>Tables</h2><span>{filteredTables.length} of {tables.length}</span></div><Table2 aria-hidden="true" size={16} /></div>
          <label className="table-search"><Search aria-hidden="true" size={15} /><span className="sr-only">Search tables by name</span><input onChange={(event) => setSearch(event.target.value)} placeholder="Search tables..." type="search" value={search} /></label>
          <div className="table-list" role="listbox" aria-label="Tables">
            {filteredTables.map((table) => (
              <button aria-selected={selectedName === table.name} className={`table-list-item${selectedName === table.name ? ' table-list-item-selected' : ''}`} key={table.name} onClick={() => setSelectedName(table.name)} role="option" type="button">
                <Table2 aria-hidden="true" size={16} /><span className="table-list-name">{table.name}</span><span className="table-list-count">{table.columns.length}</span><ChevronRight aria-hidden="true" className="table-list-chevron" size={14} />
              </button>
            ))}
            {filteredTables.length === 0 && <p className="table-empty">No matching tables.</p>}
          </div>
          <div className="constraint-legend"><span><KeyRound aria-hidden="true" size={13} /> Primary key</span><span><Link2 aria-hidden="true" size={13} /> Foreign key</span></div>
        </aside>

        {selectedTable && (
          <section aria-labelledby="table-detail-title" className="table-detail-panel">
            <div className="table-detail-heading">
              <div><div className="table-breadcrumb"><span>Tables</span><ChevronRight aria-hidden="true" size={13} /><span>{selectedTable.name}</span></div><h2 id="table-detail-title"><Table2 aria-hidden="true" size={19} />{selectedTable.name}</h2><p>{selectedTable.columns.length} columns</p></div>
              <span className="schema-badge"><Check aria-hidden="true" size={13} /> Live schema</span>
            </div>
            <div className="column-table-wrap">
              <table className="column-table"><thead><tr><th scope="col">Column</th><th scope="col">Data type</th><th scope="col">Nullable</th><th scope="col">Default</th><th scope="col">Constraints</th></tr></thead>
                <tbody>{selectedTable.columns.map((column) => {
                  const constraints = columnConstraints(selectedTable, column.name)
                  return <tr key={column.name}>
                    <td><code>{column.name}</code></td><td><code className="type-code">{column.data_type}</code></td>
                    <td><span className={`nullable-value${column.nullable ? '' : ' nullable-no'}`}>{column.nullable ? 'Yes' : 'No'}</span></td>
                    <td><code className="default-code">{column.default ?? '-'}</code></td>
                    <td>{constraints.length ? <span className="column-constraints">{constraints.map(({ label, kind }) => <span className={`constraint-chip constraint-${kind}`} key={label}>{kind === 'primary' ? <KeyRound aria-hidden="true" size={12} /> : kind === 'foreign' ? <Link2 aria-hidden="true" size={12} /> : <CircleHelp aria-hidden="true" size={12} />}{label}</span>)}</span> : <span className="no-constraint">-</span>}</td>
                  </tr>
                })}</tbody>
              </table>
            </div>
            <div className="table-detail-footnote"><CircleHelp aria-hidden="true" size={13} /> Primary key: {selectedTable.primary_key.columns.join(', ') || 'None'}{selectedTable.primary_key.name ? ` (${selectedTable.primary_key.name})` : ''}</div>
            <section aria-label="Indexes" className="table-indexes">
              <h3>Indexes <span>{selectedTable.indexes.length}</span></h3>
              {selectedTable.indexes.length ? <ul>{selectedTable.indexes.map((index) => <li key={index.name}><code>{index.name}</code><span>{index.columns.filter(Boolean).join(', ') || 'Expression index'}{index.unique ? ' · Unique' : ''}</span></li>)}</ul> : <p>No indexes reported for this table.</p>}
            </section>
          </section>
        )}
      </div>

      <section aria-labelledby="relationships-title" className="relationships-panel">
        <div className="explorer-panel-heading relationships-heading"><div><h2 id="relationships-title">Relationships</h2><p>Foreign key links returned by the schema API</p></div><Link2 aria-hidden="true" size={16} /></div>
        {relationships.length ? <div className="relationship-list">{relationships.map((relationship) => <div className="relationship-row" key={relationship.key}>
          <span className="relationship-table">{relationship.fromTable}</span><code>{relationship.fromColumns.join(', ')}</code><ArrowRight aria-hidden="true" size={15} /><span className="relationship-table">{relationship.toTable}</span><code>{relationship.toColumns.join(', ')}</code>
        </div>)}</div> : <p className="table-empty">No foreign key relationships reported.</p>}
      </section>
    </div>
  )
}
