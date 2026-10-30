import type { Cell, ColumnChange, ColumnSpec, Filter, QueryRow, TableSpec } from '@washi/ink'
import type { BlockProps } from '../../../lib/types'

export type { Cell, ColumnChange, ColumnSpec, QueryRow, TableSpec }

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
  /** Read once for a whole view; a cell without them reads its own target. */
  titles?: RelationTitles
}

export type ScalarCellProps = Omit<CellProps, 'db' | 'titles'>

export interface ChoiceCellProps extends ScalarCellProps {
  choices: Choice[]
  /** What an item reads as when no choice names it; the item itself if unset. */
  unknown?: string
}

/** Null when the table it points at cannot be read; undefined while it loads. */
export interface RelationCellProps extends ScalarCellProps {
  choices: Choice[] | null | undefined
}

/** Each relation target's rows by title, null for one that cannot be read; absent while loading. */
export type RelationTitles = Record<string, Choice[] | null>

export interface DatabaseRowsProps {
  db: DatabaseContext
  columns: ColumnSpec[]
  title: ColumnSpec | undefined
  rows: QueryRow[]
  commit: Commit
  onOpen?: (id: string) => void
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

export type SortDirection = 'asc' | 'desc'

export interface ViewSort {
  column: string
  direction: SortDirection
}

/** A reader's own sort and hidden properties for one view; never written into the page. */
export interface ViewLocal {
  sort: ViewSort | null
  hidden: string[]
  sortBy: (column: string, direction: SortDirection) => void
  clearSort: () => void
  hide: (column: string) => void
  show: (column: string) => void
}

export interface TableView {
  records: RecordsState
  rows: QueryRow[]
  columns: ColumnSpec[]
  title: ColumnSpec | undefined
  local: ViewLocal
}

export interface DatabaseHeadProps {
  db: DatabaseContext
  columns: ColumnSpec[]
  title: ColumnSpec | undefined
  local: ViewLocal
  onAdd: AddProperty
}

export interface ViewChipsProps {
  db: DatabaseContext
  local: ViewLocal
}

export interface ColumnHeadProps {
  db: DatabaseContext
  column: ColumnSpec
  isTitle: boolean
  local: ViewLocal
}

export interface ColumnMenuProps extends ColumnHeadProps {
  onDone: () => void
}

export type ColumnMenuPage = 'menu' | 'options' | 'delete'

export interface ColumnPageProps {
  db: DatabaseContext
  column: ColumnSpec
  onBack: () => void
  onDone: () => void
}

export interface OptionRowProps {
  option: string
  busy: boolean
  onRename: (to: string) => void
  onRemove: () => void
}

export interface OptionAddProps {
  label: string
  busy: boolean
  onAdd: (option: string) => void
}

export interface OptionGroup {
  group?: StatusGroup
  label: string | null
  options: string[]
}

/** One option renamed (`from` + `to`), added (`to`, into `group` for a status) or removed. */
export interface OptionEdit {
  from?: string
  to?: string
  group?: StatusGroup
}

/** An option about to go, and how many rows hold it; null when they could not be counted. */
export interface OptionRemoval {
  option: string
  count: number | null
}
