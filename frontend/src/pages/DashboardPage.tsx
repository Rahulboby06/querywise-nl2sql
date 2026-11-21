import {
  ArrowDownRight,
  ArrowRight,
  Check,
  Clock3,
  Database,
  Layers3,
  ListFilter,
  Sparkles,
  TerminalSquare,
  UsersRound,
} from 'lucide-react'
import type { PageId } from '../App'

type DashboardPageProps = {
  onNavigate: (page: PageId) => void
}

const statistics = [
  { label: 'Total tables', value: '6', detail: 'Verified local database', icon: Layers3 },
  { label: 'Total records', value: '413', detail: 'Verified local database', icon: ListFilter },
  { label: 'Database status', value: 'Connected', detail: 'Local connection', icon: Check },
  { label: 'Database engine', value: 'PostgreSQL 18', detail: 'Configured engine', icon: Database },
] as const

const sampleQueries = [
  { question: 'Average salary by department', type: 'Aggregation', icon: UsersRound },
  { question: 'Top 10 products by revenue', type: 'Ranking', icon: ArrowDownRight },
  { question: 'Total orders by status', type: 'Summary', icon: ListFilter },
  { question: 'Customers by city', type: 'Grouping', icon: UsersRound },
]

const actions: { id: PageId; title: string; description: string; icon: typeof Sparkles }[] = [
  { id: 'assistant', title: 'AI SQL Assistant', description: 'Ask questions about your data in plain language.', icon: Sparkles },
  { id: 'workspace', title: 'SQL Workspace', description: 'Write, inspect, and refine SQL queries.', icon: TerminalSquare },
  { id: 'explorer', title: 'Database Explorer', description: 'Browse tables and understand your schema.', icon: Database },
]

export function DashboardPage({ onNavigate }: DashboardPageProps) {
  return (
    <div className="dashboard-page">
      <section aria-labelledby="welcome-title" className="welcome-panel">
        <div className="welcome-copy">
          <div className="eyebrow"><span className="eyebrow-dot" /> NL2SQL</div>
          <h2 id="welcome-title">Welcome to Querywise</h2>
          <p>Explore your database by asking questions in natural language, then review the SQL behind every answer.</p>
          <div className="welcome-actions">
            <button className="primary-button" onClick={() => onNavigate('assistant')} type="button">
              <Sparkles aria-hidden="true" size={16} /> Open AI SQL Assistant <ArrowRight aria-hidden="true" className="button-arrow" size={16} />
            </button>
            <button className="secondary-button" onClick={() => onNavigate('explorer')} type="button">
              <Database aria-hidden="true" size={15} /> Explore Database
            </button>
          </div>
        </div>
        <div aria-hidden="true" className="welcome-art">
          <div className="art-orbit orbit-one" /><div className="art-orbit orbit-two" /><div className="art-grid" />
          <div className="art-query-card">
            <span className="art-query-label"><span /> NATURAL LANGUAGE</span>
            <span className="art-query-text">Show monthly revenue</span>
            <span className="art-query-divider"><Sparkles size={13} /> translated to SQL</span>
            <span className="art-code-line"><i>SELECT</i> date_trunc(...)</span>
            <span className="art-code-line"><i>FROM</i> orders</span>
          </div>
          <span className="art-sparkle sparkle-a">&#10035;</span><span className="art-sparkle sparkle-b">&#10022;</span>
        </div>
      </section>

      <section aria-labelledby="database-overview-title" className="dashboard-section stats-section">
        <div className="section-heading"><div><h2 id="database-overview-title">Database overview</h2><p>Manually verified local database values</p></div><span className="data-source-badge"><span /> Local snapshot</span></div>
        <div className="stats-grid">
          {statistics.map(({ label, value, detail, icon: Icon }) => (
            <article className="stat-card" key={label}>
              <div className="stat-icon"><Icon aria-hidden="true" size={17} strokeWidth={1.9} /></div>
              <div className="stat-copy"><span className="stat-label">{label}</span><strong className="stat-value">{value}</strong><span className="stat-detail">{detail}</span></div>
            </article>
          ))}
        </div>
        <p className="data-note">These values are a local snapshot and are not live API statistics.</p>
      </section>

      <div className="dashboard-lower-grid">
        <section aria-labelledby="recent-queries-title" className="dashboard-section content-panel">
          <div className="section-heading panel-heading"><div><h2 id="recent-queries-title">Recent queries</h2><p>Examples to help you get started</p></div><span className="sample-badge">Illustrative samples</span></div>
          <div className="sample-notice"><Sparkles aria-hidden="true" size={14} /><span>Sample prompts only · No query execution history yet</span></div>
          <ul className="query-list">
            {sampleQueries.map(({ question, type, icon: Icon }) => (
              <li key={question}><span className="query-icon"><Icon aria-hidden="true" size={15} /></span><span className="query-question">{question}</span><span className="query-type">{type}</span><ArrowRight aria-hidden="true" className="query-arrow" size={14} /></li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="quick-actions-title" className="dashboard-section content-panel quick-actions-panel">
          <div className="section-heading panel-heading"><div><h2 id="quick-actions-title">Quick actions</h2><p>Jump back into your workflow</p></div><Clock3 aria-hidden="true" className="heading-icon" size={16} /></div>
          <div className="quick-action-list">
            {actions.map(({ id, title, description, icon: Icon }) => (
              <button className="quick-action" key={id} onClick={() => onNavigate(id)} type="button">
                <span className="destination-icon"><Icon aria-hidden="true" size={17} strokeWidth={1.8} /></span>
                <span className="destination-copy"><span className="destination-title">{title}</span><span className="destination-description">{description}</span></span>
                <ArrowRight aria-hidden="true" className="destination-arrow" size={15} />
              </button>
            ))}
          </div>
        </section>
      </div>
      <footer className="dashboard-footer"><span>Designed to keep you in control of your data.</span><span className="footer-status"><span /> Ready to explore</span></footer>
    </div>
  )
}
