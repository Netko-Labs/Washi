import type { SheetDetail } from '@washi/domain'
import type { Diagnostic } from '@washi/wsx'

export interface SourceEditorProps {
  sheet: SheetDetail
}

export interface SourceState {
  draft: string
  diagnostics: Diagnostic[]
  /** The source as the server last had it from this editor — a different one came from someone else. */
  savedSource: string | null
  /** The Loro version the draft was read at; a save sends it so the server can merge. */
  version: string | null
  /** Bumps whenever the text changes under the editor rather than from typing into it. */
  revision: number
  load: (source: string, version: string | null) => void
  type: (draft: string) => void
  /** A merged save or someone else's edit replaces the text in the editor. */
  absorb: (source: string, version: string | null) => void
  markSaved: (source: string, version: string | null) => void
}
