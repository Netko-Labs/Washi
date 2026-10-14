import type { SheetDetail } from '@washi/domain'
import type { WsxElement } from '@washi/wsx'

export type SheetState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; error: string }
  | { status: 'ready'; sheet: SheetDetail; root: WsxElement }

export interface SheetFailedProps {
  error: string
}
