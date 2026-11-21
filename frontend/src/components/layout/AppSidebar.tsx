import {
  ChevronDown,
  ChevronLeft,
  CircleHelp,
  Command,
  Database,
  History,
  LayoutDashboard,
  Sparkles,
  X,
} from 'lucide-react'
import { useEffect, useRef } from 'react'
import { profileInitials, type Profile } from '../../lib/profile'
import type { PageId } from '../../App'

type AppSidebarProps = {
  profile: Profile
  activePage: PageId
  isMobileNavOpen: boolean
  isExpanded: boolean
  onToggleExpanded: () => void
  onNavigate: (page: PageId) => void
  onCloseMobileNav: () => void
}

const primaryNavigation: { id: PageId; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'assistant', label: 'AI SQL Assistant', icon: Sparkles },
  { id: 'explorer', label: 'Database Explorer', icon: Database },
  { id: 'history', label: 'Query History', icon: History },
]

export function AppSidebar({
  activePage,
  profile,
  isMobileNavOpen,
  isExpanded,
  onToggleExpanded,
  onNavigate,
  onCloseMobileNav,
}: AppSidebarProps) {
  const sidebar = useRef<HTMLElement>(null)
  const closeButton = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!isMobileNavOpen) return

    closeButton.current?.focus()
    const previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const desktop = window.matchMedia('(min-width: 761px)')
    const handleResize = () => {
      if (desktop.matches) onCloseMobileNav()
    }
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseMobileNav()
      }
      if (event.key !== 'Tab') return
      const buttons = Array.from(sidebar.current?.querySelectorAll<HTMLButtonElement>('button:not(:disabled)') ?? [])
        .filter((button) => button.getClientRects().length > 0)
      const first = buttons[0]
      const last = buttons[buttons.length - 1]
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last?.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first?.focus()
      }
    }
    document.addEventListener('keydown', handleKeyDown)
    desktop.addEventListener('change', handleResize)
    return () => {
      document.body.style.overflow = previousOverflow
      document.removeEventListener('keydown', handleKeyDown)
      desktop.removeEventListener('change', handleResize)
    }
  }, [isMobileNavOpen, onCloseMobileNav])

  return (
    <>
      {isMobileNavOpen && (
        <button
          aria-label="Close navigation menu"
          className="sidebar-backdrop"
          tabIndex={-1}
          onClick={onCloseMobileNav}
          type="button"
        />
      )}
      <aside aria-label="Navigation menu" aria-modal={isMobileNavOpen ? true : undefined} className={`sidebar${isMobileNavOpen ? ' sidebar-open' : ''}`} id="app-sidebar" ref={sidebar} role={isMobileNavOpen ? 'dialog' : undefined}>
        <div className="sidebar-brand-row">
          <button
            aria-label={isMobileNavOpen ? 'NL2SQL: Close navigation menu' : `NL2SQL: ${isExpanded ? 'Collapse' : 'Expand'} sidebar`}
            aria-expanded={isMobileNavOpen || isExpanded}
            aria-controls="sidebar-navigation"
            className="brand-lockup"
            onClick={isMobileNavOpen ? onCloseMobileNav : onToggleExpanded}
            type="button"
          >
            <span className="brand-mark"><Command aria-hidden="true" size={18} strokeWidth={2.4} /></span>
            <span className="brand-copy">
              <span className="brand-name">NL2SQL</span>
              <span className="brand-subtitle">AI Database Assistant</span>
            </span>
            <span aria-hidden="true" className="rail-tooltip">Expand sidebar</span>
          </button>
          {isExpanded && (
            <button
              aria-label="Collapse sidebar"
              className="icon-button sidebar-collapse"
              onClick={() => {
                onToggleExpanded()
                sidebar.current?.querySelector<HTMLButtonElement>('.brand-lockup')?.focus()
              }}
              type="button"
            >
              <ChevronLeft aria-hidden="true" size={18} />
            </button>
          )}
          <button
            aria-label="Close navigation menu"
            className="icon-button sidebar-close"
            onClick={onCloseMobileNav}
            ref={closeButton}
            type="button"
          >
            <X aria-hidden="true" size={18} />
          </button>
        </div>

        <button aria-label="Personal workspace" className="workspace-switcher" type="button">
          <span className="workspace-switcher-icon"><Database aria-hidden="true" size={15} /></span>
          <span className="workspace-switcher-copy">
            <span className="workspace-switcher-label">WORKSPACE</span>
            <span className="workspace-switcher-name">Personal workspace</span>
          </span>
          <ChevronDown aria-hidden="true" className="workspace-switcher-chevron" size={15} />
          <span aria-hidden="true" className="rail-tooltip">Personal workspace</span>
        </button>

        <nav aria-label="Main navigation" className="sidebar-navigation" id="sidebar-navigation">
          <span className="nav-section-label">Workspace</span>
          {primaryNavigation.map(({ id, label, icon: Icon }) => (
            <button
              aria-current={activePage === id ? 'page' : undefined}
              aria-label={label}
              className={`nav-item${activePage === id ? ' nav-item-active' : ''}`}
              key={id}
              onClick={() => onNavigate(id)}
              type="button"
            >
              <Icon aria-hidden="true" className="nav-item-icon" size={17} strokeWidth={1.8} />
              <span className="nav-item-label">{label}</span>
              <span aria-hidden="true" className="rail-tooltip">{label}</span>
              {id === 'assistant' && <span className="nav-item-badge">AI</span>}
            </button>
          ))}
        </nav>

        <div className="sidebar-bottom">
          <button aria-label="Help & support" className="help-link" type="button">
            <CircleHelp aria-hidden="true" size={16} strokeWidth={1.8} />
            <span className="nav-item-label">Help &amp; support</span>
            <span aria-hidden="true" className="rail-tooltip">Help &amp; support</span>
          </button>
          <button aria-label={`Open profile for ${profile.fullName}`} aria-current={activePage === 'profile' ? 'page' : undefined} className={`profile-card profile-entry${activePage === 'profile' ? ' profile-entry-active' : ''}`} onClick={() => onNavigate('profile')} type="button">
            <span aria-hidden="true" className="avatar avatar-sidebar">{profileInitials(profile.fullName)}</span>
            <span className="profile-copy"><span className="profile-name">{profile.fullName}</span><span className="profile-role">Local profile</span></span>
            <ChevronDown aria-hidden="true" className="profile-chevron" size={15} />
            <span aria-hidden="true" className="rail-tooltip">Open profile</span>
          </button>
        </div>
      </aside>
    </>
  )
}
