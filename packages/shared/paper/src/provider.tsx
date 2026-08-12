import type { InkQuery, QueryResult } from '@washi/ink'
import { createContext, type ReactNode, useContext } from 'react'

export interface ActionRef {
  verb: string
  [key: string]: unknown
}

/**
 * The capability surface a rendered sheet may touch. The host app wires these
 * to RPC; paper components never reach the network or database directly.
 */
export interface PaperHost {
  runQuery(query: InkQuery): Promise<QueryResult>
  runAction(action: ActionRef): Promise<void>
  runFetch(url: string): Promise<string>
  resolveSheet(id: string): Promise<{ title: string; icon: string | null } | null>
  openSheet(id: string): void
  toggleTask(recordId: string, done: boolean): Promise<void>
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
