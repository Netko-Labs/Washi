import type { SheetSummary } from '@washi/domain'
import type { ComponentType, RefObject } from 'react'

export type Audience = SheetSummary['visibility']

export interface ShareSettings {
  visibility: Audience
  access: string[]
  token: string | null
  /** The link takes suggested rows (D120). */
  suggest: boolean
  /** The link opens the page's sub-pages too (D123). */
  subpages: boolean
  hidden: { blocks: number; tabs: number; columns: Record<string, string[]> }
}

export interface ShareToggleProps {
  value: boolean
  busy: boolean
  onChange: (on: boolean) => void
}

export interface ShareSwitchProps extends ShareToggleProps {
  icon: ComponentType<{ className?: string }>
  label: string
  detail: string
}

export interface ShareButtonProps {
  sheet: SheetSummary
}

export interface SharePanelProps {
  sheet: SheetSummary
  onClose: () => void
}

export interface ShareAudienceProps {
  value: Audience
  busy: boolean
  onChange: (audience: Audience) => void
}

export interface SharePeopleProps {
  access: string[]
  me: string | null
  busy: boolean
  onToggle: (memberId: string) => void
}

export interface ShareLinkProps {
  url: string
  hidden: ShareSettings['hidden']
}

export interface ShareMenu {
  isOpen: boolean
  toggle: () => void
  close: () => void
  root: RefObject<HTMLDivElement | null>
  trigger: RefObject<HTMLButtonElement | null>
  panel: RefObject<HTMLDivElement | null>
}
