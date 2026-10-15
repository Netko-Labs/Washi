import type { SheetSummary } from '@washi/domain'

export type ChromePicker = 'icon' | 'cover'

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
