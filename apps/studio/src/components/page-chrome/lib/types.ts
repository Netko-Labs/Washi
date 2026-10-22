import type { SheetSummary } from '@washi/domain'
import type { CSSProperties } from 'react'

export type ChromePicker = 'icon' | 'cover'
export type CoverKind = 'preset' | 'picture' | 'file'
export type CoverTab = 'presets' | 'pictures' | 'upload'

export interface ParsedCover {
  kind: CoverKind
  key: string
}

export interface Preset {
  label: string
  background: string
}

export interface Picture {
  slug: string
  label: string
}

export interface CoverLook {
  style: CSSProperties
  /** What the band says it is — a picture's name; nothing for a preset or an upload. */
  caption: string | null
}

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
  current: string | null
  onPick: (value: string | null) => void
  onClose: () => void
}
