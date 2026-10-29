import type { AccessTokenInfo, IssuedAccessToken } from '@washi/domain'

/** Who a bearer token speaks for, in which workspace. */
export interface TokenOwner {
  actorId: string
  workspaceId: string
}

/**
 * A person's tokens for one workspace — how an agent outside Washi (an MCP client) acts as them.
 * Absent in embedded mode: the desktop has no port to reach.
 */
export interface TokenStore {
  list(actorId: string, workspaceId: string): Promise<AccessTokenInfo[]>
  create(actorId: string, workspaceId: string, name: string): Promise<IssuedAccessToken>
  /** Only its owner's; another person's id does nothing. */
  revoke(actorId: string, id: string): Promise<void>
  /** Null for anything that is not a live token. */
  verify(token: string): Promise<TokenOwner | null>
}

/** What `requireTokens` reads off a procedure's context. */
export interface TokenContext {
  actorId: string | null
  runtime: { control: { tokens?: TokenStore } }
}
