import { useRef, useState, type ReactNode } from 'react'
import type { Profile } from '../../lib/profile'
import type { AppTheme, PageId } from '../../App'
import { AppHeader } from './AppHeader'
import { AppSidebar } from './AppSidebar'

type AppLayoutProps = {
  profile: Profile
  activePage: PageId
  children: ReactNode
  isMobileNavOpen: boolean
  onNavigate: (page: PageId) => void
  onCloseMobileNav: () => void
  onOpenMobileNav: () => void
  pageTitle: string
  theme: AppTheme
  onThemeChange: (theme: AppTheme) => void
}

export function AppLayout({
  activePage,
  profile,
  children,
  isMobileNavOpen,
  onNavigate,
  onCloseMobileNav,
  onOpenMobileNav,
  pageTitle,
  theme,
  onThemeChange,
}: AppLayoutProps) {
  const [isSidebarExpanded, setIsSidebarExpanded] = useState(false)
  const mobileNavOpener = useRef<HTMLButtonElement>(null)
  const mainContent = useRef<HTMLElement>(null)

  const dismissMobileNav = () => {
    onCloseMobileNav()
    requestAnimationFrame(() => {
      const opener = mobileNavOpener.current
      if (opener?.getClientRects().length) opener.focus()
      else document.querySelector<HTMLButtonElement>('#app-sidebar .brand-lockup')?.focus()
    })
  }

  const navigate = (page: PageId) => {
    onNavigate(page)
    if (isMobileNavOpen) {
      onCloseMobileNav()
      requestAnimationFrame(() => mainContent.current?.focus())
    }
  }

  return (
    <div className={`app-shell${isSidebarExpanded ? '' : ' sidebar-compact'}`}>
      <AppSidebar
        activePage={activePage}
        profile={profile}
        isMobileNavOpen={isMobileNavOpen}
        isExpanded={isSidebarExpanded}
        onToggleExpanded={() => setIsSidebarExpanded((expanded) => !expanded)}
        onCloseMobileNav={dismissMobileNav}
        onNavigate={navigate}
      />
      <div className="app-main" inert={isMobileNavOpen}>
        <AppHeader
          activePage={activePage}
          onOpenMobileNav={onOpenMobileNav}
          isMobileNavOpen={isMobileNavOpen}
          mobileNavOpener={mobileNavOpener}
          onThemeChange={onThemeChange}
          pageTitle={pageTitle}
          theme={theme}
        />
        <main className="page-content" ref={mainContent} tabIndex={-1}>{children}</main>
      </div>
    </div>
  )
}
