import type { DragEvent, RefObject } from 'react'
import type { ActionRef, BlockProps, Row } from '../../../lib/types'
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
  openable: boolean
  open: (row: Row) => void
  shown: (value: Row[string] | undefined) => string
  add: (action: ActionRef, group: string) => void
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
