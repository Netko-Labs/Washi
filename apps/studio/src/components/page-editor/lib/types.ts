import type { SheetDetail, UploadKind } from '@washi/domain'
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

export interface BlockListProps {
  blocks: Block[]
  rootProps: Record<string, WsxValue>
  isNested?: boolean
}

export interface ColumnsRowProps {
  block: ColumnsBlock
  rootProps: Record<string, WsxValue>
}

export interface TabsRowProps {
  block: TabsBlock
  rootProps: Record<string, WsxValue>
}

export interface TabLabelProps {
  tabsId: string
  tab: TabSlot
  isActive: boolean
}

export interface TabMenuProps {
  tabsId: string
  tabId: string
  onRename: () => void
}

export interface ColumnGapProps {
  columnsId: string
  index: number
  /** The left column's part of the pair, 0–100. */
  share: number
}

export type TabActions = Pick<
  EditorState,
  'shownTabs' | 'showTab' | 'addTab' | 'renameTab' | 'moveTab' | 'removeTab'
>

export type SaveState = 'saved' | 'saving' | 'failed' | 'invalid'

export type EditMode = 'blocks' | 'source'

export interface PageEditorProps {
  sheet: SheetDetail
  root: WsxElement
}

export interface KindOption {
  kind: TextKind
  label: string
  hint: string
}

export interface BlockRowProps {
  block: Block
  numberAt: number
  rootProps: Record<string, WsxValue>
  /** Inside a column: a narrower handle, and no columns within columns. */
  isNested?: boolean
}

export interface BlockInputProps {
  block: TextBlock
  numberAt: number
}

export interface EditToggleProps {
  sheetId: string
}

export interface BlockMenuProps {
  block: Block
}

export interface PageBodyProps {
  sheet: SheetDetail
  root: WsxElement
}

/** A table the `/` menu can drop live onto the page, and which status counts as shipped. */
export interface TableRef {
  name: string
  done: { column: string; values: string[] } | null
}

export type DataPick =
  | { kind: 'view'; table: string }
  | { kind: 'progress'; table: TableRef }
  | { kind: 'database'; name: string }
  | { kind: 'subpage' }
  | { kind: 'subpages'; layout: 'list' | 'gallery' }
  | { kind: 'link'; sheet: string }
  | { kind: 'embed'; src: string }
  | { kind: 'bookmark'; href: string }
  /** `file` arrives once the person picked one; the menu offers the kind. */
  | { kind: 'upload'; as: UploadKind; file?: File }
  | { kind: 'gallery'; files?: File[] }
  | { kind: 'code' }
  | { kind: 'widget' }
  | { kind: 'formula' }
  | { kind: 'automation'; table: string }
  | { kind: 'tabs' }

/** What `links.preview` read off a site, before it becomes a Bookmark's props. */
export interface BookmarkPreview {
  title: string | null
  description: string | null
  image: string | null
  site: string | null
}

/** An upload once stored: what a block needs to point at it. */
export interface StoredUpload {
  id: string
  name: string
  size: number
}

/** A page the `/` menu can link to. */
export interface PageRef {
  id: string
  title: string
}

export type SlashOption =
  | ({ type: 'text' } & KindOption)
  | { type: 'data'; key: string; label: string; hint: string; pick: DataPick }

export interface SlashMenuProps {
  id: string
  query: string
  onPick: (option: SlashOption) => void
}

export interface ScriptBlockProps {
  block: LockedBlock
  rootProps: Record<string, WsxValue>
}

export interface ScriptCodeProps {
  block: LockedBlock
}

export type ScriptCheck =
  | { status: 'checking' }
  | { status: 'ok' }
  | { status: 'refused'; error: string }

export interface LockedBlockProps {
  block: LockedBlock
  rootProps: Record<string, WsxValue>
}

export interface FocusRequest {
  id: string
  caret: number | 'end'
}

export interface EditorState {
  editingId: string | null
  mode: EditMode
  blocks: Block[]
  focus: FocusRequest | null
  saveState: SaveState
  focusFirst: boolean
  /** The Loro version the blocks were read at; a save sends it so the server can merge. */
  version: string | null
  /** The page as the server last had it from this editor — a different source came from someone else. */
  savedSource: string | null
  /** `focus`: the caret lands in the first block, as on a page that was just made. */
  startEditing: (id: string, focus?: boolean, mode?: EditMode) => void
  setMode: (mode: EditMode) => void
  stopEditing: () => void
  load: (blocks: Block[], version?: string | null, source?: string | null) => void
  /** Someone else's edit, merged: new blocks in, the rows still under the caret keep their ids. */
  absorb: (blocks: Block[], version: string | null, source: string) => void
  setText: (id: string, text: string) => void
  setDone: (id: string, done: boolean) => void
  turnInto: (id: string, kind: TextKind) => void
  /** Enter: the text after the caret moves into a new block below. */
  splitAt: (id: string, caret: number) => void
  /** Backspace at the start: un-style, or join the block above. */
  mergeBack: (id: string) => void
  insertAfter: (id: string) => void
  remove: (id: string) => void
  move: (id: string, step: -1 | 1) => void
  moveFocus: (id: string, step: -1 | 1) => void
  setSaveState: (saveState: SaveState) => void
  tables: TableRef[]
  setTables: (tables: TableRef[]) => void
  /** Swaps the `/` block for a live block — a view, a progress chart, a new database. */
  insertData: (id: string, pick: DataPick) => Promise<void>
  /** A live block that edits itself (a canvas) — its new markup rides the next save. */
  replaceInBlock: (id: string, from: WsxElement, to: WsxElement) => void
  /** The block a ⋮⋮ is dragging, and where it would land now. */
  dragging: string | null
  drop: DropZone | null
  setDragging: (id: string | null) => void
  setDrop: (drop: DropZone | null) => void
  /** Lands the dragged block above, below or beside `targetId`. */
  moveTo: (id: string, targetId: string, place: DropPlace) => void
  /** The gap after column `index` dragged to `fraction` of that column and the next. */
  resize: (columnsId: string, index: number, fraction: number) => void
  /** The tab each strip shows, by Tabs block id — the editor's own, never saved. */
  shownTabs: Record<string, string>
  showTab: (tabsId: string, tabId: string) => void
  addTab: (tabsId: string) => void
  renameTab: (tabsId: string, tabId: string, label: string) => void
  moveTab: (tabsId: string, tabId: string, step: -1 | 1) => void
  /** Its blocks go with it; down to one tab, the strip unwraps into the page. */
  removeTab: (tabsId: string, tabId: string) => void
}
