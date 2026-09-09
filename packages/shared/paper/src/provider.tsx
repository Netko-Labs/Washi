import type { InkQuery, QueryResult, TableSpec } from '@washi/ink'
import { createContext, type ReactNode, useContext } from 'react'
import type { ActionRef } from './lib/types'

/**
 * The capability surface a rendered sheet may touch. The host app wires these
 * to RPC; paper components never reach the network or database directly.
 */
export interface PaperHost {
  runQuery(query: InkQuery): Promise<QueryResult>
  runAction(action: ActionRef): Promise<void>
  resolveSheet(id: string): Promise<{ title: string; icon: string | null } | null>
  openSheet(id: string): void
  toggleTask(recordId: string, done: boolean): Promise<void>
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
