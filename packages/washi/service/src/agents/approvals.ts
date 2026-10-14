import type { ApprovalDecision, ApprovalRequest } from '@washi/domain'
import {
  createApproval,
  getAppMeta,
  resolveApproval,
  setAppMeta,
  type Workspace,
} from '@washi/repository'
import { checkUrl } from '@washi/tsuru'
import type { CapabilityDesk } from './desk'
import {
  APPROVAL_TIMEOUT_MS,
  AUTO_APPROVE_KEY,
  CHANGE_TOOLS,
  type EventsRef,
  READ_TOOLS,
  ROUTINE_APPROVAL_TIMEOUT_MS,
} from './lib'
import { shortToolName } from './normalize'
import type { ToolGate, ToolVerdict } from './ports'
import { currentFetchPolicy } from './tools'

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

  hasPending(): boolean {
    return this.pending.size > 0
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

  /** A finished or stopped turn takes its open questions — and its patience — with it. */
  dropSession(sessionId: string): void {
    this.patient.delete(sessionId)
    for (const [id, entry] of this.pending) {
      if (entry.request.sessionId === sessionId) this.resolve(id, 'reject_once')
    }
  }

  autoApproving(): boolean {
    return getAppMeta(this.ws, AUTO_APPROVE_KEY) === '1'
  }

  /** Turning it on also answers the changes already waiting — that is what was asked. */
  setAutoApprove(on: boolean, actorId: string | null): void {
    setAppMeta(this.ws, AUTO_APPROVE_KEY, on ? '1' : '0')
    if (!on) return
    for (const [id, entry] of this.pending) {
      if (CHANGE_TOOLS.has(entry.request.toolName)) this.resolve(id, 'allow_once', actorId)
    }
  }

  async approve(sessionId: string, toolName: string, input: unknown): Promise<boolean> {
    if (CHANGE_TOOLS.has(toolName) && this.autoApproving()) return true
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

    if (name === 'fetch_url' && typeof input.url === 'string') {
      const verdict = checkUrl(input.url, currentFetchPolicy(this.ws))
      if (verdict.ok) return { behavior: 'allow', updatedInput: input }
      if (!verdict.needsApproval) return { behavior: 'deny', message: verdict.reason }
    }

    return (await this.approve(sessionId, name, input))
      ? { behavior: 'allow', updatedInput: input }
      : { behavior: 'deny', message: 'the user declined this action' }
  }

  private remember(sessionId: string, toolName: string, input: unknown) {
    const url = (input as { url?: unknown } | null)?.url
    if (toolName === 'fetch_url' && typeof url === 'string') {
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
