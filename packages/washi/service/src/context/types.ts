import type { WsxElement } from '@washi/wsx'

/** What `context_get` is asked for. */
export interface ContextOptions {
  /** A page id: only it and the pages under it. Without it, every page the reader may read. */
  root?: string
  /** How many levels under the root (or the top level) to read; 0 is the root alone. */
  depth?: number
  /** Tables whose open rows to list; without it, every table with a status column. */
  tables?: string[]
  /** The digest's length cap, in characters. */
  maxChars?: number
}

/** What rendering a page needs to know beyond its own markup. */
export interface RenderContext {
  /** Titles of the pages the reader may read, by id — a PageLink or a Ref names them. */
  titles: Map<string, string>
  /** Children of each page, in order — a `<Subpages>` lists them. */
  children: Map<string, string[]>
  /** The page being drawn, for a `<Subpages>` without `of`. */
  pageId: string
  /** A Stat's or a Money's `expr` worked out over the tables, or null when it cannot be here. */
  evaluate?: (expr: string) => string | null
}

/** A page the budget may give words to: its heading, and its words read only when asked. */
export interface PageCandidate {
  id: string
  title: string
  head: string
  body: () => string
}

/** The pages that fit: each one's section, and those cut short or not read at all. */
export interface FittedPages {
  sections: string[]
  cut: string[]
  dropped: number
}

/** A table's rows as the budget sees them, and how to read them all. */
export interface BudgetRows {
  name: string
  text: string
  fetch: string
  /** Open rows the text never held (past what was read). */
  unshown: number
}

/** Who asks for a digest, and what the workspace is called. */
export interface ContextRequest extends ContextOptions {
  /** The workspace's name, for the digest's first line. */
  workspaceName?: string
}

/** A row as the digest reads it. */
export type ContextRow = Record<string, unknown> & { id: string }

/** A table's rows in words, the call that reads them all, and how many open rows went unread. */
export interface RowsText {
  text: string | null
  fetch: string
  unshown?: number
}

/** A table as the digest may say it, each part read only when it has room. */
export interface TableDigest {
  name: string
  summary: () => string
  rows: () => RowsText
}

/** The agent guide as the reader may read it. */
export interface AgentGuide {
  id: string
  title: string
  markdown: string
}

/** A page's markup and the walk state the renderer carries down it. */
export interface RenderState {
  ctx: RenderContext
  /** How deep in Sections the walk is, for heading levels. */
  level: number
}

export type { WsxElement }
