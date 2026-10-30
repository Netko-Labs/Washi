import type { DragEvent, RefObject } from 'react'
import type { ActionRef, AddMode, BlockProps, Row } from '../../../lib/types'
import type { BindQuery } from '../../../registry'

export interface BoardProps extends BlockProps {
  bind: BindQuery
  groupBy: string
  groups?: string[]
  rank?: string
  title?: string
  kicker?: string
  badge?: string
  meta?: string
  avatar?: string
  onAdd?: ActionRef
  onOpen?: ActionRef
  empty?: string
}

/** Where a card was dropped. `against` is null while the write is on its way. */
export interface Move {
  group: string
  rank: number
  against: Row[] | null
}

export interface DropTarget {
  group: string
  before: string | null
}

export interface BoardColumn {
  name: string
  items: Row[]
}

export interface BoardDrag {
  boardRef: RefObject<HTMLDivElement | null>
  columns: BoardColumn[]
  dragging: string | null
  target: DropTarget | null
  slotHeight: number
  start: (id: string, event: DragEvent<HTMLElement>) => void
  end: () => void
  over: (group: string, event: DragEvent<HTMLElement>) => void
  drop: (event: DragEvent<HTMLElement>) => void
}

export interface CardActions {
  /** The host's, so counts and sums read in the reader's numbers. */
  locale?: string
  openable: boolean
  open: (row: Row) => void
  /** A cell in words: named people, numbers in their column's format once the spec is read. */
  shown: (value: Row[string] | undefined, column?: string) => string
  /** Whether the table's spec has arrived — until then a card draws no avatar rather than an id. */
  isSpecRead: boolean
  /** A select or status column's options in their own order; none until the spec is read. */
  optionsOf: (column: string) => string[]
  add: (action: ActionRef, group: string) => void
  /**
   * Notion's + New in a column: the row is made already in it and opened where the reader is;
   * through a link that takes suggestions, its title is asked and sent to be approved (D120).
   */
  creatable: boolean
  create: (draft: BoardDraft) => void
  /** How an add lands here: a read-only link draws none, one that suggests asks first (D120). */
  mode: AddMode
  suggest: BoardSuggest
}

/** A suggested card: its column, and the title field asked for. */
export interface BoardDraft {
  group: string
  groupBy: string
  title: string
}

export interface BoardSuggest {
  draft: BoardDraft | null
  open: (draft: BoardDraft) => void
  close: () => void
  note: string | null
  landed: () => void
}

export interface BoardCardProps {
  row: Row
  titleKey: string
  kicker?: string
  badge?: string
  meta?: string
  avatar?: string
  dragging: boolean
  actions: CardActions
  onDragStart: (event: DragEvent<HTMLElement>) => void
  onDragEnd: () => void
}

export interface BoardLayout {
  groupBy: string
  rank: string
  groups?: string[]
  /** The group column's own options, the order unnamed columns follow. */
  options: string[]
}

export interface DragState {
  id: string
  target: DropTarget
  slotHeight: number
}

export interface SlidePosition {
  x: number
  y: number
}

export interface RankPatch {
  id: string
  rank: number
}
