import type { Scalar } from '@washi/ink'

export type Row = Record<string, Scalar>

export type CellKind = 'string' | 'number'

export interface ActionRef {
  verb: string
  [key: string]: unknown
}

export interface BindState {
  rows: Row[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
}

/**
 * Tables that expressions aggregate over, fetched once per sheet and again after
 * every verb — or after anyone else's write. `version` is what bound primitives watch.
 */
export interface DataContextValue {
  tables: Record<string, Row[]>
  version: number
  refresh: () => void
}
