import type { SheetDetail } from '@washi/domain'
import type { WsxElement, WsxValue } from '@washi/wsx'
import type { RefObject } from 'react'
import type {
  Block,
  ColumnsBlock,
  LockedBlock,
  TabSlot,
  TabsBlock,
  TextBlock,
  TextKind,
} from './blocks'
import type { SlashGroup } from './slash'
import type { EditorState } from './store'

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

/** A block `/` drops in with words to type over (D107). */
export type StarterBlock = 'steps' | 'compare' | 'faq' | 'countdown' | 'bento'

export interface StarterOption {
  block: StarterBlock
  label: string
  hint: string
  words: string
  group: SlashGroup
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

export interface BlockMenuState {
  isOpen: boolean
  toggle: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
  trigger: RefObject<HTMLButtonElement | null>
  menu: RefObject<HTMLDivElement | null>
}

export interface PageBodyProps {
  sheet: SheetDetail
  root: WsxElement
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

export interface TerminalFilesProps {
  block: LockedBlock
}

/** An upload a Terminal may be handed: one stored already, offered by the picker. */
export interface UploadChoice {
  id: string
  name: string
  size: number
}
