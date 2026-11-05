export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
  theme: Theme
  /** False until the stored choice is read; the store is imported on the server too. */
  isHydrated: boolean
  /** Reads the stored choice; with none, `fallback` (paper, or the device's own on a link). */
  hydrate: (fallback: Theme) => void
  setTheme: (theme: Theme) => void
}
