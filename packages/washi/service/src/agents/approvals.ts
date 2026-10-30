import { ANY_HOST, type ApprovalDecision, type ApprovalRequest } from '@washi/domain'
import {
  clearSessionApprovals,
  createApproval,
  getAppMeta,
  getSession,
  recordCapability,
  resolveApproval,
  setAppMeta,
  type Workspace,
} from '@washi/repository'
import { checkUrl, EXA_SEARCH_URL, type PolicyVerdict } from '@washi/tsuru'
import { serverApprovesAll } from '../server'
import type { CapabilityDesk } from './desk'
import {
  APPROVAL_MODE_KEY,
  APPROVAL_MODES,
  APPROVAL_TIMEOUT_MS,
  type ApprovalMode,
  CHANGE_TOOLS,
  type EventsRef,
  READ_TOOLS,
  ROUTINE_APPROVAL_TIMEOUT_MS,
  SERVER_APPROVED,
  YOLO_ALLOWED_KEY,
} from './lib'
import { shortToolName } from './normalize'
import type { ToolGate, ToolVerdict } from './ports'
import { currentFetchPolicy } from './tools'

/** A search always goes to the one Exa host; "always" on it lists that host, like any fetch. */
function outboundUrl(toolName: string, input: unknown): string | null {
  if (toolName === 'web_search') return EXA_SEARCH_URL
  const url = (input as { url?: unknown } | null)?.url
  return toolName === 'fetch_url' && typeof url === 'string' ? url : null
}

/** Said as FORBIDDEN: a conversation's approvals are its starter's, where the workspace allows. */
export class SessionApprovalsError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SessionApprovalsError'
  }
}

/**
 * Where an agent's writes wait for a person. Both ports reach it: the Claude
 * SDK through `canUseTool`, the AI SDK through `toolApproval` — one desk, so
 * neither port can grow a wider capability surface than the other.
 */
export class ApprovalDesk implements ToolGate {
  private readonly ws: Workspace
  private readonly events: EventsRef
  private readonly desk: CapabilityDesk
  private readonly pending = new Map<
    string,
    { request: ApprovalRequest; settle: (decision: ApprovalDecision) => void }
  >()
  private readonly alwaysAllowed = new Map<string, Set<string>>()
  /** Off-list hosts a yes let one fetch reach: one per yes, gone with the turn. */
  private readonly fetchGrants = new Map<string, string[]>()
  /** Sessions nobody is watching live — a routine's questions wait for the morning. */
  private readonly patient = new Set<string>()

  constructor(ws: Workspace, events: EventsRef, desk: CapabilityDesk) {
    this.ws = ws
    this.events = events
    this.desk = desk
  }

  waitLonger(sessionId: string): void {
    this.patient.add(sessionId)
  }

  isRead(toolName: string): boolean {
    return READ_TOOLS.has(toolName)
  }

  mode(): ApprovalMode {
    const stored = getAppMeta(this.ws, APPROVAL_MODE_KEY)
    return APPROVAL_MODES.find((mode) => mode === stored) ?? 'ask'
  }

  setMode(mode: ApprovalMode): ApprovalMode {
    setAppMeta(this.ws, APPROVAL_MODE_KEY, mode)
    return this.mode()
  }

  yoloAllowed(): boolean {
    return getAppMeta(this.ws, YOLO_ALLOWED_KEY) === '1'
  }

  /** Off puts every conversation back on the workspace's mode (D115). */
  setYoloAllowed(allowed: boolean): boolean {
    setAppMeta(this.ws, YOLO_ALLOWED_KEY, allowed ? '1' : '')
    if (!allowed) clearSessionApprovals(this.ws)
    return this.yoloAllowed()
  }

  /** Null always goes back to the workspace's mode; anything else is the starter's, if allowed. */
  checkSessionApprovals(sessionId: string, approvals: ApprovalMode | null, actorId: string) {
    if (approvals === null) return
    if (!this.yoloAllowed()) {
      throw new SessionApprovalsError(
        'this workspace does not let a conversation approve for itself',
      )
    }
    if (getSession(this.ws, sessionId)?.createdBy !== actorId) {
      throw new SessionApprovalsError('only whoever started this chat can change its approvals')
    }
  }

  hasPending(): boolean {
    return this.pending.size > 0
  }

  /** A turn waiting on a person is not a quiet one (D114). */
  isWaitingIn(sessionId: string): boolean {
    for (const entry of this.pending.values())
      if (entry.request.sessionId === sessionId) return true
    return false
  }

  /** Live questions only: a client that opens late still sees what Washi is waiting on. */
  list(): ApprovalRequest[] {
    return [...this.pending.values()].map((entry) => entry.request)
  }

  /** `actorId` is who answered — the team's audit trail. Null for a timeout or a Stop. */
  resolve(id: string, decision: ApprovalDecision, actorId: string | null = null): void {
    resolveApproval(this.ws, id, decision === 'reject_once' ? 'denied' : 'allowed', actorId)
    this.pending.get(id)?.settle(decision)
    this.pending.delete(id)
  }

  /** A finished or stopped turn takes its open questions — its patience and grants — with it. */
  dropSession(sessionId: string): void {
    this.patient.delete(sessionId)
    this.fetchGrants.delete(sessionId)
    for (const [id, entry] of this.pending) {
      if (entry.request.sessionId === sessionId) this.resolve(id, 'reject_once')
    }
  }

  async approve(sessionId: string, toolName: string, input: unknown): Promise<boolean> {
    if (CHANGE_TOOLS.has(toolName)) return true
    const verdict = this.policyVerdict(toolName, input)
    if (verdict?.ok) return true
    if (verdict && !verdict.needsApproval) return false
    const allowed = await this.decide(sessionId, toolName, input)
    if (allowed && verdict) this.grantFetch(sessionId, toolName, input)
    return allowed
  }

  /** The host a yes let this session's fetch of `url` reach, used up as it is handed out. */
  takeFetchGrant(sessionId: string, url: string): string | null {
    const host = URL.canParse(url) ? new URL(url).hostname : null
    const hosts = this.fetchGrants.get(sessionId) ?? []
    const at = host ? hosts.indexOf(host) : -1
    if (!host || at < 0) return null
    hosts.splice(at, 1)
    return host
  }

  private async decide(sessionId: string, toolName: string, input: unknown): Promise<boolean> {
    if (serverApprovesAll(this.ws)) {
      recordCapability(this.ws, {
        origin: 'agent',
        subject: toolName,
        input,
        decision: 'auto',
        detail: SERVER_APPROVED,
      })
      return true
    }
    const standing = this.standingYes(sessionId)
    if (standing) {
      recordCapability(this.ws, {
        origin: 'agent',
        actorId: standing.actorId,
        subject: toolName,
        input,
        decision: 'auto',
      })
      return true
    }
    if (this.alwaysAllowed.get(sessionId)?.has(toolName)) return true
    const decision = await this.request(sessionId, toolName, input)
    if (decision === 'allow_always') this.remember(sessionId, toolName, input)
    return decision !== 'reject_once'
  }

  /** The Claude SDK's view: reads pass, off-policy fetches and writes ask. */
  async gateSdkTool(
    sessionId: string,
    fullName: string,
    input: Record<string, unknown>,
  ): Promise<ToolVerdict> {
    if (!fullName.startsWith('mcp__washi__')) {
      return { behavior: 'deny', message: 'only washi tools are available in this app' }
    }
    const name = shortToolName(fullName)
    if (this.isRead(name)) return { behavior: 'allow', updatedInput: input }

    const verdict = this.policyVerdict(name, input)
    if (verdict && !verdict.ok && !verdict.needsApproval) {
      return { behavior: 'deny', message: verdict.reason }
    }

    return (await this.approve(sessionId, name, input))
      ? { behavior: 'allow', updatedInput: input }
      : { behavior: 'deny', message: 'the user declined this action' }
  }

  /** A conversation's own say wins while allowed, signed by its starter; a routine has none. */
  private standingYes(sessionId: string): { actorId: string | null } | null {
    const session = this.yoloAllowed() ? getSession(this.ws, sessionId) : null
    const own = session?.createdBy ? session.approvals : null
    if ((own ?? this.mode()) !== 'auto') return null
    return { actorId: own === 'auto' ? (session?.createdBy ?? null) : null }
  }

  /**
   * What leaves the server, judged by the fetch policy: a host listed by name passes, any other asks.
   * `*` lets tsuru reach every public site, never past the desk (D118).
   */
  private policyVerdict(toolName: string, input: unknown): PolicyVerdict | null {
    const url = outboundUrl(toolName, input)
    if (!url) return null
    const policy = currentFetchPolicy(this.ws)
    const named = policy.allowedHosts.filter((host) => host !== ANY_HOST)
    return checkUrl(url, { ...policy, allowedHosts: named })
  }

  /** Tsuru reads only its lists, so a yes to an off-list fetch travels to the tool as a grant. */
  private grantFetch(sessionId: string, toolName: string, input: unknown) {
    const url = toolName === 'fetch_url' ? outboundUrl(toolName, input) : null
    if (!url || !URL.canParse(url)) return
    const hosts = this.fetchGrants.get(sessionId) ?? []
    hosts.push(new URL(url).hostname)
    this.fetchGrants.set(sessionId, hosts)
  }

  private remember(sessionId: string, toolName: string, input: unknown) {
    const url = outboundUrl(toolName, input)
    if (url) {
      this.desk.allowFetchHost(url)
      return
    }
    const allowed = this.alwaysAllowed.get(sessionId) ?? new Set()
    allowed.add(toolName)
    this.alwaysAllowed.set(sessionId, allowed)
  }

  private request(sessionId: string, toolName: string, input: unknown): Promise<ApprovalDecision> {
    const request = createApproval(this.ws, sessionId, toolName, input)
    this.events()?.approval(request)
    return new Promise((resolve) => {
      const timeout = setTimeout(
        () => {
          this.pending.delete(request.id)
          resolveApproval(this.ws, request.id, 'denied')
          resolve('reject_once')
        },
        this.patient.has(sessionId) ? ROUTINE_APPROVAL_TIMEOUT_MS : APPROVAL_TIMEOUT_MS,
      )
      this.pending.set(request.id, {
        request,
        settle: (decision) => {
          clearTimeout(timeout)
          resolve(decision)
        },
      })
    })
  }
}
