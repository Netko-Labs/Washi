import type { Cell, ColumnSpec, Filter, QueryRow, TableSpec } from '@washi/ink'
import type { BlockProps } from '../../../lib/types'

export type { Cell, ColumnSpec, QueryRow, TableSpec }

export interface DatabaseView {
  name: string
  kind: 'table' | 'board'
  groupBy?: string
  where?: Filter[]
  columns?: string[]
}

export interface DatabaseProps extends BlockProps {
  table: string
  views?: DatabaseView[]
  empty?: string
}

export interface Person {
  id: string
  name: string
}

export interface DatabaseContext {
  table: string
  spec: TableSpec
  people: Person[]
}

export interface ViewProps {
  db: DatabaseContext
  view: DatabaseView
  empty?: string
}

export type Commit = (row: string, column: string, value: Cell) => Promise<void>

export interface CellProps {
  db: DatabaseContext
  column: ColumnSpec
  value: Cell | undefined
  commit: (value: Cell) => void
}

export interface Choice {
  value: string
  label: string
}

export interface RecordsState {
  rows: QueryRow[]
  status: 'loading' | 'ready' | 'error'
  error: string | null
}
