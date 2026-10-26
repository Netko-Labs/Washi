import type { SheetSummary } from '@washi/domain'

export type Audience = SheetSummary['visibility']

export interface ShareSettings {
  visibility: Audience
  access: string[]
  token: string | null
  hidden: { blocks: number; columns: Record<string, string[]> }
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
