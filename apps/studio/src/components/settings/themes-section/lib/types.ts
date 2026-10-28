import type { WorkspaceTheme, WorkspaceThemeWrite } from '@washi/domain'
import type { ThemeCheck, ThemeMode, ThemeTokens } from '@washi/paper/registry'

/** What the editor holds: a theme being made (`id` null) or changed. */
export interface EditorDraft extends WorkspaceThemeWrite {
  id: string | null
  /** Tokens an import left out, filled from the base — "light muted", "dark card". */
  filled: string[]
}

export interface ThemeEditorState {
  draft: EditorDraft
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  setName: (name: string) => void
  setToken: (token: keyof ThemeTokens, color: string) => void
  startFrom: (key: string) => void
  checks: ThemeCheck[]
  isRefused: boolean
}

export interface ThemeCardProps {
  theme: WorkspaceTheme
  madeBy: string
  isChangeable: boolean
  onEdit: () => void
  onRemove: () => void
}

export interface ThemeEditorProps {
  initial: EditorDraft
  onSave: (draft: EditorDraft) => Promise<string | null>
  onClose: () => void
}

export interface ThemeImportProps {
  onRead: (draft: EditorDraft) => void
  onClose: () => void
}

export interface TokenRowProps {
  label: string
  value: string
  onChange: (color: string) => void
}

export interface ThemePreviewProps {
  tokens: ThemeTokens
}

export interface ThemeChecksProps {
  checks: ThemeCheck[]
}

export interface TokenGroup {
  label: string
  tokens: { key: keyof ThemeTokens; label: string }[]
}

export interface EditorSaveState {
  busy: boolean
  error: string | null
}
