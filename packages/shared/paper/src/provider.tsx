import type { HistoryQuery, InkQuery, QueryResult, TableSpec } from '@washi/ink'
import type { WsxElement } from '@washi/wsx'
import { createContext, type ReactNode, useContext } from 'react'
import type { ActionRef } from './lib/types'

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
  /** Ticks `field` (default `done`) on the row; refused unless it is a checkbox column. */
  toggleTask(recordId: string, done: boolean, field?: string): Promise<void>
  /** Column specs, so a select Field offers the column's options — never the page's. */
  describeTable(name: string): Promise<TableSpec | null>
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
