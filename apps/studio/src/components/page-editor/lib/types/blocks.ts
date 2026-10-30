import type { WsxElement, WsxValue } from '@washi/wsx'

export type TextKind =
  | 'text'
  | 'h1'
  | 'h2'
  | 'h3'
  | 'bullet'
  | 'number'
  | 'todo'
  | 'quote'
  | 'code'
  | 'callout'
  | 'divider'

export interface TextBlock {
  id: string
  kind: TextKind
  text: string
  done?: boolean
  /** The element's own props (lead, tone, lang…), kept while its kind stays the same. */
  props: Record<string, WsxValue>
}

/** Anything Washi built that is more than text — kept whole, moved and deleted as one. */
export interface LockedBlock {
  id: string
  kind: 'locked'
  node: WsxElement
}

/** One column of a Columns block: its share of the width and its own run of blocks. */
export interface ColumnSlot {
  id: string
  ratio: number
  props: Record<string, WsxValue>
  blocks: Block[]
}

/** Notion's columns, edited in place: each column types like the page. Never nested. */
export interface ColumnsBlock {
  id: string
  kind: 'columns'
  props: Record<string, WsxValue>
  columns: ColumnSlot[]
}

/** One tab of a Tabs block: its label and its own run of blocks. */
export interface TabSlot {
  id: string
  label: string
  props: Record<string, WsxValue>
  blocks: Block[]
}

/** Tab sections, edited in place like columns; `props.labels` is rewritten from the tabs on save. */
export interface TabsBlock {
  id: string
  kind: 'tabs'
  props: Record<string, WsxValue>
  tabs: TabSlot[]
}

export type Block = TextBlock | LockedBlock | ColumnsBlock | TabsBlock

/** A block holding runs of blocks. Never inside another. */
export type ContainerBlock = ColumnsBlock | TabsBlock

/** One run of blocks inside a container: a column or a tab. */
export type Slot = ColumnSlot | TabSlot

/** Where a dragged block lands against another: above, below, or beside as a new column. */
export type DropPlace = 'before' | 'after' | 'left' | 'right'

export interface DropZone {
  id: string
  place: DropPlace
}

/** Where a block sits: its list, its index, and the column or tab holding it (null at the top level). */
export interface BlockPlace {
  list: Block[]
  at: number
  parentId: string | null
  slotId: string | null
}
