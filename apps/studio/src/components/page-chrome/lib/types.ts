import type { SheetSummary } from '@washi/domain'
import type { LookPart } from '@washi/paper'

export type CoverTab = 'presets' | 'pictures' | 'unsplash' | 'upload'
export type IconTab = 'emoji' | 'upload'

export interface UploadState {
  busy: boolean
  error: string | null
}

export interface WashiMarkProps {
  sheet: SheetSummary
}

export interface PageChromeProps {
  pageId: string
}

export interface PickerProps {
  anchor: HTMLElement
  current: string | null
  onPick: (value: string | null) => void
  onClose: () => void
}

export interface UploadDropProps {
  hint: string
  onPick: (key: string) => void
}

export interface PickerTabsProps<T extends string> {
  tabs: readonly { id: T; label: string }[]
  active: T
  onChange: (tab: T) => void
}

export interface LookPickerState {
  open: { part: LookPart; anchor: HTMLElement } | null
  show: (part: LookPart, anchor: HTMLElement) => void
  close: () => void
}

export type AnchoredAt = { top: number; left: number } | { top: number; right: number }
