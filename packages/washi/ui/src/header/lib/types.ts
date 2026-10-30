import type { SheetSummary } from '@washi/domain'
import type { ReactNode } from 'react'
import type { AgentMascotState } from '../../mascot'

export interface PillInput {
  mood: AgentMascotState
  /** A turn runs or a question waits in the chat on screen, which follows this page. */
  isBusy: boolean
  sheet: Pick<SheetSummary, 'editedBy' | 'hlcUpdated'> | undefined
  now: number
}

export interface HeaderProps {
  /** Before the breadcrumb — the web's drawer button. */
  leading?: ReactNode
  /** The host's own buttons on the right: Copy link on the web, Share on the desktop. */
  actions?: ReactNode
  /** The host's actions hold the star (a phone's ⋯), so the crumbs leave it out. */
  starInActions?: boolean
}

export interface HeaderCrumbsProps {
  starInActions?: boolean
}
