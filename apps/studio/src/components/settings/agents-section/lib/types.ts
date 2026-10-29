import type { AccessTokenInfo, IssuedAccessToken } from '@washi/domain'

export interface AgentsSectionProps {
  workspaceId: string
}

export interface AccessTokens {
  isAvailable: boolean
  tokens: AccessTokenInfo[]
  /** The token just made — the only time its secret is on screen. */
  issued: IssuedAccessToken | null
  error: string | null
  create: (name: string) => Promise<boolean>
  revoke: (id: string) => Promise<void>
  dismiss: () => void
}

export interface CopyLineProps {
  label: string
  value: string
  /** Shown instead of the value when it holds a secret the person already copied. */
  isSecret?: boolean
}

export interface TokenRowProps {
  token: AccessTokenInfo
  onRevoke: () => void
}
