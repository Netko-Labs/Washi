/** Who an OAuth access token speaks for, and through which client. */
export interface OAuthCaller {
  actorId: string
  clientId: string
}

/**
 * The OAuth side of outside agents (D101): a person signs an agent in, picks one or more
 * workspaces on consent (D124), and its access tokens act there. Absent in embedded mode.
 */
export interface OAuthStore {
  /** Null for anything that is not a live access token for this server's MCP resource. */
  verify(token: string): Promise<OAuthCaller | null>
  /**
   * The workspaces the person chose on consent for this client, the default first (D124); it
   * replaces an earlier choice whole.
   */
  grant(actorId: string, clientId: string, workspaceIds: string[]): Promise<void>
  /** Where this client may act for its person, the default first; none before consent. */
  workspacesOf(caller: OAuthCaller): Promise<string[]>
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
