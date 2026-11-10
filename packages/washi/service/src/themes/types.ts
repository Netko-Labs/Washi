import type { WorkspaceTheme, WorkspaceThemeWrite } from '@washi/domain'

/** Who changes a theme: its maker, or a steward (an owner or an admin) who may change any. */
export interface ThemeChanger {
  id: string
  mayChangeAny: boolean
}

/** A theme defined by the slug a page names it by (D139): made, or changed in place. */
export interface ThemeDefinition extends WorkspaceThemeWrite {
  slug: string
}

export interface DefinedTheme {
  theme: WorkspaceTheme
  created: boolean
  /** Pairings that read, but not well: each in words, as the editor flags them. */
  warnings: string[]
}
