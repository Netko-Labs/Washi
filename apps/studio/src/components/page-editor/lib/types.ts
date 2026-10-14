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

export type SaveState = 'saved' | 'saving' | 'failed'

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

export interface SlashMenuProps {
  query: string
  onPick: (kind: TextKind) => void
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
  blocks: Block[]
  focus: FocusRequest | null
  saveState: SaveState
  startEditing: (id: string) => void
  stopEditing: () => void
  load: (blocks: Block[]) => void
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
}
