export type Theme = 'light' | 'dark' | 'system'

export interface ThemeState {
  theme: Theme
  /** False until the stored choice is read; the store is imported on the server too. */
  isHydrated: boolean
  hydrate: () => void
  setTheme: (theme: Theme) => void
}
