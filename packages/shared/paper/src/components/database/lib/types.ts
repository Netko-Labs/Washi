import type { Cell, ColumnSpec, Filter, QueryRow, TableSpec } from '@washi/ink'
import type { BlockProps } from '../../../lib/types'

export type { Cell, ColumnSpec, QueryRow, TableSpec }

export interface DatabaseView {
  name: string
  kind: 'table' | 'board' | 'timeline' | 'gallery'
  groupBy?: string
  /** A gallery's picture: a url column (https) or one holding a cover key. */
  cover?: string
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

export type AddProperty = (
  name: string,
  type: ColumnSpec['type'],
  options: string[],
  format?: string,
) => Promise<void>

export interface AddPropertyProps {
  onAdd: AddProperty
  taken: string[]
  /** Words beside the +, where the button stands alone (a row page) rather than in a header. */
  label?: string
}

export interface PropertyPanelProps extends AddPropertyProps {
  onDone: () => void
}

export interface PropertyDraft {
  label: string
  type: ColumnSpec['type']
  options: string[]
  typing: string
  /** A number's format: '' plain, `percent`, or a currency code. */
  format: string
}

export interface PropertyStatus {
  busy: boolean
  error: string | null
}

export interface PropertyOptionsProps {
  draft: PropertyDraft
  edit: (patch: Partial<PropertyDraft>) => void
}

export type PropertyFormatProps = PropertyOptionsProps

export interface NumberFormatChoice {
  value: string
  label: string
  name: string
}

export interface PropertyType {
  type: ColumnSpec['type']
  label: string
  hint: string
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

export interface GalleryCardProps {
  db: DatabaseContext
  row: QueryRow
  title: ColumnSpec | undefined
  cover: ColumnSpec | undefined
  shown: ColumnSpec[]
  onOpen?: () => void
}

export interface CardValueProps {
  db: DatabaseContext
  column: ColumnSpec
  value: Cell | undefined
}
