import type { WsxElement } from '@washi/wsx'
import type { Block, DropPlace, DropZone, TextKind } from './blocks'
import type { EditMode, SaveState } from './props'
import type { DataPick, TableRef } from './slash'

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
  /** Empties a block still reading `typed`: a picker closed or refused leaves no `/image` behind. */
  dropSlash: (id: string, typed: string) => void
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
