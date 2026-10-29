import type { Scalar, TableSpec } from '@washi/ink'

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

/** What a view knows of its table beyond the rows: its columns and who a person cell names. */
export interface TableLook {
  spec: TableSpec | null
  /** Null when the host cannot say who is on the team — then nobody is named, nor called gone. */
  people: { id: string; name: string }[] | null
}
