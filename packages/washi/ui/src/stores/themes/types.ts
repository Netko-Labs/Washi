import type { WorkspaceTheme } from '@washi/domain'
import type { ThemePair } from '@washi/paper/registry'

export interface ThemesState {
  themes: WorkspaceTheme[]
  refresh: () => Promise<void>
  reset: () => void
  /** The tokens a page wearing `ws:<slug>` is lent; undefined once the theme is gone. */
  pairOf: (key: string) => ThemePair | undefined
}
