import { Command } from 'lucide-react'
import type { RefObject } from 'react'
import type { AppTheme, PageId } from '../../App'
import { ThemeToggle } from './ThemeToggle'

type AppHeaderProps = {
  pageTitle: string
  activePage: PageId
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
  onOpenMobileNav: () => void
  isMobileNavOpen: boolean
  mobileNavOpener: RefObject<HTMLButtonElement | null>
}

export function AppHeader({
  pageTitle,
  activePage,
  theme,
  onThemeChange,
  onOpenMobileNav,
  isMobileNavOpen,
  mobileNavOpener,
}: AppHeaderProps) {
  return (
    <header className="app-header">
      <div className="header-title-group">
        <button aria-label="NL2SQL: Open navigation menu" aria-controls="app-sidebar" aria-expanded={isMobileNavOpen} className="brand-lockup mobile-menu-button" onClick={onOpenMobileNav} ref={mobileNavOpener} type="button">
          <span className="brand-mark"><Command aria-hidden="true" size={18} strokeWidth={2.4} /></span>
        </button>
        <div>
          <div aria-label={`Workspace / ${pageTitle}`} className="breadcrumbs">
            <span>Workspace</span>
            <span aria-hidden="true" className="breadcrumb-divider">/</span>
            <span className="breadcrumb-current">{pageTitle}</span>
          </div>
          <h1 className="header-title">{activePage === 'dashboard' ? 'Querywise Dashboard' : pageTitle}</h1>
        </div>
      </div>
      <div className="header-actions">
        <ThemeToggle onChange={onThemeChange} theme={theme} />
      </div>
      <span className="sr-only">Current section: {activePage}</span>
    </header>
  )
}
