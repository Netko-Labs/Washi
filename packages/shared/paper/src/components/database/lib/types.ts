import type { Cell, ColumnSpec, Filter, QueryRow, TableSpec } from '@washi/ink'
import type { BlockProps } from '../../../lib/types'

export type { Cell, ColumnSpec, QueryRow, TableSpec }

export interface DatabaseView {
  name: string
  kind: 'table' | 'board' | 'timeline'
  groupBy?: string
  date?: string
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

/** Null while loading; a table that is not there, or could not be read, says so. */
export type DatabaseLoad = DatabaseContext | null | 'missing' | 'unreadable'

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

export type ScalarCellProps = Omit<CellProps, 'db'>

export interface ChoiceCellProps extends ScalarCellProps {
  choices: Choice[]
}

export type StatusGroup = 'todo' | 'doing' | 'done'

export interface ChoiceLookProps {
  column: ColumnSpec
  value: string
  label: string
  index: number
}

export interface PropertyIconProps {
  type: ColumnSpec['type']
}

export interface DateInputsProps extends ScalarCellProps {
  onDone: () => void
}

export interface AddPropertyProps {
  onAdd: (name: string, type: ColumnSpec['type'], options: string[]) => Promise<void>
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
