import type { SheetSummary } from '@washi/domain'
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

/** A page as the digest reads it: where it sits and its words. */
export interface ContextPage {
  meta: SheetSummary
  depth: number
  /** Its words as Markdown, or null when its source would not parse. */
  body: string | null
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

/** A page's words as the budget sees them. */
export interface BudgetPage {
  id: string
  title: string
  body: string
}

/** A table's rows as the budget sees them, and how to read them all. */
export interface BudgetRows {
  name: string
  text: string
  fetch: string
}

/** What fit: each page's and table's text, and what was cut or left out, said for fetching. */
export interface Fitted {
  pages: { id: string; body: string }[]
  rows: { name: string; text: string }[]
  leftOut: string[]
}

/** Who asks for a digest, and what the workspace is called. */
export interface ContextRequest extends ContextOptions {
  /** The workspace's name, for the digest's first line. */
  workspaceName?: string
}

/** A table's place in the digest: what it holds and, maybe, the rows still open. */
export interface TableDigest {
  summary: string
  rows: string | null
  rowsFetch: string
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
