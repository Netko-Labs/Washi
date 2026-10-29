/** Who an OAuth access token speaks for, and through which client. */
export interface OAuthCaller {
  actorId: string
  clientId: string
}

/**
 * The OAuth side of outside agents (D101): a person signs an agent in, picks the workspace on
 * consent, and its access tokens act there. Absent in embedded mode.
 */
export interface OAuthStore {
  /** Null for anything that is not a live access token for this server's MCP resource. */
  verify(token: string): Promise<OAuthCaller | null>
  /** What the person chose on consent for this client; it replaces an earlier choice. */
  grant(actorId: string, clientId: string, workspaceId: string): Promise<void>
  workspaceOf(caller: OAuthCaller): Promise<string | null>
  /** How a client calls itself, for the consent screen. */
  clientName(clientId: string): Promise<string | null>
  /** The discovery documents a client reads first, or null when the path is not one. */
  discovery(request: Request): Promise<Response | null>
}

/** What the oauth router reads off a procedure's context. */
export interface OAuthContext {
  actorId: string | null
  runtime: {
    control: {
      oauth?: OAuthStore
      authorize(actorId: string | null, workspaceId: string): Promise<boolean>
    }
  }
}
