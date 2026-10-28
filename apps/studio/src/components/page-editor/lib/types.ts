import type { SheetDetail } from '@washi/domain'
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

export type Block = TextBlock | LockedBlock

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

/** A page the `/` menu can link to. */
export interface PageRef {
  id: string
  title: string
}

export type SlashOption =
  | ({ type: 'text' } & KindOption)
  | { type: 'data'; key: string; label: string; hint: string; pick: DataPick }

export interface SlashMenuProps {
  query: string
  onPick: (option: SlashOption) => void
}

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
}
