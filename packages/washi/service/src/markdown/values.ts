import type { AlertLook } from './types'

/** The longest Markdown one import takes. */
export const MAX_MARKDOWN_CHARS = 500_000

/** What a written `<Table>` holds (paper's registry): more columns stay Markdown in a Code block. */
export const TABLE_MAX_COLUMNS = 16
/** Rows per written Table; a longer one is split into several under the same heads. */
export const TABLE_MAX_ROWS = 200
export const TABLE_CELL_CHARS = 2000
export const TABLE_COLUMN_CHARS = 64

export const TITLE_CHARS = 200
export const FIGURE_ALT_CHARS = 300
export const DEFAULT_TITLE = 'Imported page'

/** A Code block's `lang`, as a fence names it. */
export const CODE_LANG = /^[\w+#.-]{1,32}$/

/** Where a written link may go — paper reads only these as links (D122). */
export const LINK_HREF = /^(https:\/\/|mailto:)[^\s()<>]+$/

/** `> [!NOTE]` and its kin, GitHub's alerts, as Callouts. */
export const ALERTS: Record<string, AlertLook> = {
  NOTE: { tone: 'info', title: 'Note' },
  TIP: { tone: 'success', title: 'Tip' },
  IMPORTANT: { tone: 'info', title: 'Important' },
  WARNING: { tone: 'warning', title: 'Warning' },
  CAUTION: { tone: 'danger', title: 'Caution' },
}

export const ALERT_MARKER = /^\[!(NOTE|TIP|IMPORTANT|WARNING|CAUTION)\][ \t]*\n?/i
