import { Moon, Sun } from 'lucide-react'
import type { AppTheme } from '../../App'

type ThemeToggleProps = {
  theme: AppTheme
  onChange: (theme: AppTheme) => void
}

export function ThemeToggle({ theme, onChange }: ThemeToggleProps) {
  const nextTheme = theme === 'light' ? 'dark' : 'light'
  const Icon = theme === 'light' ? Moon : Sun

  return (
    <button
      aria-label={`Switch to ${nextTheme} theme`}
      className="icon-button"
      onClick={() => onChange(nextTheme)}
      title={`Switch to ${nextTheme} theme`}
      type="button"
    >
      <Icon aria-hidden="true" size={18} strokeWidth={1.8} />
    </button>
  )
}
