import type { ColumnChange, HistoryQuery, InkQuery, QueryResult, TableSpec } from '@washi/ink'
import type { WsxElement } from '@washi/wsx'
import { createContext, type ReactNode, useContext } from 'react'
import type { ActionRef, CompiledScript, PageCard } from './lib/types'

/**
 * The capability surface a rendered sheet may touch. The host app wires these
 * to RPC; paper components never reach the network or database directly.
 */
export interface PaperHost {
  runQuery(query: InkQuery): Promise<QueryResult>
  /** `{ day, count }` per day: how many rows matched when each day closed. */
  runHistory?(query: HistoryQuery): Promise<QueryResult>
  runAction(action: ActionRef): Promise<void>
  resolveSheet(id: string): Promise<{ title: string; icon: string | null } | null>
  openSheet(id: string): void
  /** The page being drawn; `<Subpages>` without `of` lists its children. */
  pageId?: string
  /** A page's children in tree order. A host with no page tree (a shared link) leaves it out. */
  listPages?(parentId: string): PageCard[]
  /** Calls back when the page tree moved; returns the unsubscribe. */
  onPagesChange?(listener: () => void): () => void
  /** Pages that link here, readable by this reader; a host without the index leaves it out. */
  backlinks?(id: string): Promise<PageCard[]>
  /** Another page's parsed source, for `<Include>`; null when the reader cannot open it. */
  loadSheet?(id: string): Promise<{ title: string; root: WsxElement } | null>
  /** A page that runs, bundled for the sandbox (D100); without it, only its literal parts draw. */
  compilePage?(source: string): Promise<CompiledScript>
  /** One of the page's components bundled with React for a widget's frame; without it, none draw. */
  compileWidget?(source: string, component: string): Promise<CompiledScript>
  /** A Terminal's program bundled for its frame (D119); without it, no terminal runs. */
  compileTerminal?(program: string): Promise<CompiledScript>
  /**
   * An upload's bytes the reader may open, held to the server's cap (D119) — `useFile` and a
   * Terminal's files. Rejects in words; without it, nothing is read.
   */
  readFile?(key: string): Promise<Uint8Array>
  /** Who is reading, for a page's `useMe()`; a host with no accounts leaves it out. */
  describeMe?(): Promise<{ id: string; name: string } | null>
  /** Whether an owner lets this workspace's pages run widgets; without it, none run. */
  widgetsAllowed?(): Promise<boolean>
  /** Whether the workspace lists `host` for embeds; without it only built-in providers play. */
  embedAllowed?(host: string): Promise<boolean>
  /** Makes a page under `parentId` and opens it, as Notion's + New page does. */
  newPage?(parentId: string): Promise<void>
  /** Who a person cell can name. A host with no members (one person, offline) leaves it out. */
  describePeople?(): Promise<{ id: string; name: string }[]>
  /**
   * Swaps one element of the open page for another and saves it — how a hand-drawn canvas
   * writes itself back. A read-only host leaves it out, and the canvas stays still.
   */
  replaceNode?(from: WsxElement, to: WsxElement): Promise<void>
  /** Calls back when table data moved somewhere else (a teammate, Washi); returns the unsubscribe. */
  onDataChange?(listener: () => void): () => void
  /** Opens a record as its own page, Notion-style. A host without row pages leaves it out. */
  openRow?(recordId: string): void
  /**
   * Adds a row and opens it where the reader is, to be filled in; without it a new row is inline.
   * It resolves either way: a host says itself why a row was not added.
   */
  newRow?(table: string, data: Record<string, string>): Promise<void>
  /** Ticks `field` (default `done`) on the row; refused unless it is a checkbox column. */
  toggleTask(recordId: string, done: boolean, field?: string): Promise<void>
  /** Column specs, so a select Field offers the column's options — never the page's. */
  describeTable(name: string): Promise<TableSpec | null>
  /**
   * Renames or deletes a property, or edits its options, from a column's menu; rejects in words.
   * A host that cannot change a table (a shared link) leaves it out: the menu only sorts, hides.
   */
  changeColumn?(change: ColumnChange): Promise<void>
  /** Titles of the pages whose views name a column — what its rename or delete leaves behind. */
  columnPages?(table: string, column: string): Promise<string[]>
  /** BCP-47; dates and money format from the vault locale at render, never in a page. */
  locale?: string
}

const PaperContext = createContext<PaperHost | null>(null)

export function PaperProvider({ host, children }: { host: PaperHost; children: ReactNode }) {
  return <PaperContext.Provider value={host}>{children}</PaperContext.Provider>
}

export function usePaperHost(): PaperHost {
  const host = useContext(PaperContext)
  if (!host) throw new Error('paper components must render inside <PaperProvider>')
  return host
}
