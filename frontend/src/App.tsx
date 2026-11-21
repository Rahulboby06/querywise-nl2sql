import { useEffect, useState } from 'react'
import './App.css'
import { AppLayout } from './components/layout/AppLayout'
import { DashboardPage } from './pages/DashboardPage'
import { DatabaseExplorerPage } from './pages/DatabaseExplorerPage'
import { AssistantPage } from './pages/AssistantPage'
import { ProfilePage } from './pages/ProfilePage'
import { HistoryPage } from './pages/HistoryPage'
import { loadProfile } from './lib/profile'
import { PlaceholderPage } from './pages/PlaceholderPage'

export type PageId =
  | 'dashboard'
  | 'assistant'
  | 'workspace'
  | 'explorer'
  | 'history'
  | 'prompt-lab'
  | 'evaluation'
  | 'profile'

export type AppTheme = 'light' | 'dark'

const pageTitles: Record<PageId, string> = {
  dashboard: 'Dashboard',
  assistant: 'AI SQL Assistant',
  workspace: 'SQL Workspace',
  explorer: 'Database Explorer',
  history: 'Query History',
  'prompt-lab': 'Prompt Engineering Lab',
  evaluation: 'Evaluation Dashboard',
  profile: 'Profile',
}

function getInitialTheme(): AppTheme {
  try {
    const savedTheme = window.localStorage.getItem('nl2sql-theme')
    if (savedTheme === 'light' || savedTheme === 'dark') return savedTheme
  } catch {
    // The inline bootstrap sets a safe initial theme if storage is unavailable.
  }
  return document.documentElement.dataset.theme === 'dark' ? 'dark' : 'light'
}

function App() {
  const [profile, setProfile] = useState(loadProfile)
  const [activePage, setActivePage] = useState<PageId>('dashboard')
  const [theme, setTheme] = useState<AppTheme>(getInitialTheme)
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    window.localStorage.setItem('nl2sql-theme', theme)
  }, [theme])

  const navigate = (page: PageId) => {
    setActivePage(page)
    setIsMobileNavOpen(false)
  }

  return (
    <AppLayout
      activePage={activePage}
      profile={profile}
      isMobileNavOpen={isMobileNavOpen}
      onNavigate={navigate}
      onCloseMobileNav={() => setIsMobileNavOpen(false)}
      onOpenMobileNav={() => setIsMobileNavOpen(true)}
      pageTitle={pageTitles[activePage]}
      theme={theme}
      onThemeChange={setTheme}
    >
      {activePage === 'dashboard' ? (
        <DashboardPage onNavigate={navigate} />
      ) : activePage === 'explorer' ? (
        <DatabaseExplorerPage />
      ) : activePage === 'assistant' ? (
        <AssistantPage theme={theme} />
      ) : activePage === 'profile' ? (
        <ProfilePage profile={profile} onSave={setProfile} />
      ) : activePage === 'history' ? (
        <HistoryPage />
      ) : (
        <PlaceholderPage pageTitle={pageTitles[activePage]} />
      )}
    </AppLayout>
  )
}

export default App
