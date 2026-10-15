import type { SheetDetail, SheetSummary } from '@washi/domain'
import type { PaperHost } from '@washi/paper'
import type { WsxElement } from '@washi/wsx'
import type { ComponentType, ReactNode } from 'react'

export type SheetState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'missing' }
  | { status: 'failed'; error: string }
  | { status: 'ready'; sheet: SheetDetail; root: WsxElement }

export interface PageSheet {
  summary: SheetSummary | undefined
  state: SheetState
  host: PaperHost
}

export interface SheetFailedProps {
  error: string
}

export interface SheetBodyProps {
  sheet: SheetDetail
  root: WsxElement
}

export interface SheetViewProps {
  /** The host's own band above the sheet — cover and icon on the web. */
  chrome?: ReactNode
  /** The host's band below the sheet — what links here, on the web. */
  footer?: ReactNode
  /** Draws the sheet instead of the plain view — the web's editor. */
  body?: ComponentType<SheetBodyProps>
}
