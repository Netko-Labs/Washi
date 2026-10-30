import type { Theme } from './types'

export function isTheme(value: unknown): value is Theme {
  return value === 'light' || value === 'dark' || value === 'system'
}

export function isDarkFor(theme: Theme, prefersDark: boolean): boolean {
  return theme === 'dark' || (theme === 'system' && prefersDark)
}
