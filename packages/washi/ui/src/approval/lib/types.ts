import type { Icon } from '@tabler/icons-react'

/** A tool call said the way a person would: "Create a page · Trip to Kyoto". */
export interface ToolDescription {
  icon: Icon
  action: string
  subject: string | null
  details: string[]
  /** Leaves the server — the only kind of tool that still asks. */
  outbound: boolean
  /** A page's source, for a preview before it is saved. */
  preview: string | null
}

export type TitleOf = (sheetId: string) => string | null

export interface ApprovalCardProps {
  toolName: string
  input: unknown
  onDecide: (decision: 'allow_once' | 'allow_always' | 'reject_once') => Promise<void>
  /** How many more are waiting behind this one. */
  more?: number
}

export interface PagePreviewProps {
  source: string
}

export type RestoreState = 'idle' | 'busy' | 'restored' | 'gone'

export interface RestorePageProps {
  /** The page Washi moved to the trash. */
  id: string
}
