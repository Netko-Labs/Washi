import type {
  AgentUpdate,
  ApprovalRequest,
  AttachmentRef,
  CapabilityOrigin,
  EnabledModel,
  TranscriptEntry,
  Viewer,
} from '@washi/domain'
import type { ProviderId } from '../ports'
import type { APPROVAL_MODES, EFFORTS, RESUME_BY, SDK_EFFORT } from './constants'

/**
 * Where a turn's inference comes from. `api_key` bills a key — the workspace's
 * own on a hosted server, the machine's env when embedded. `local_cli` runs the
 * person's installed Claude Code, whose own login pays; embedded only.
 */
export type AgentCredential =
  | {
      kind: 'api_key'
      apiKey: string
      provider: ProviderId
      /** Provider-native model id. Falls back to the provider's default. */
      model?: string
    }
  | {
      kind: 'local_cli'
      executable: string
      provider: 'anthropic'
      model?: string
      /** Signed in to a claude.ai subscription. A Console login is a key in disguise. */
      plan: boolean
    }

export type InferencePreference = 'auto' | 'local_cli' | 'api_key'

export type LocalModel = 'default' | 'opus' | 'sonnet' | 'haiku'

export interface LocalCliStatus {
  executable: string
  version: string | null
  loggedIn: boolean
  /** `claude.ai` for a subscription login, `console` and friends for a metered one. */
  authMethod: string | null
  /** pro · max · team — what the person's plan is, never who they are. */
  plan: string | null
}

export interface InferenceStatus {
  preference: InferencePreference
  /** What the next turn will run on, or null when nothing can run it. */
  active: AgentCredential['kind'] | null
  /** Null on a hosted server — a team server never runs someone's local login. */
  localCli: LocalCliStatus | null
  /** Which model the local CLI runs; null on a hosted server. */
  localModel: LocalModel | null
  apiKey: { provider: string; source: 'environment' | 'workspace' | 'server' } | null
  /** Why nothing is active, in words a person can act on. */
  missing: string | null
}

export interface AgentKeySource {
  /** Null when nothing this deployment knows about can run a turn. */
  resolve(): Promise<AgentCredential | null>
  status(): Promise<InferenceStatus>
  /** Embedded only. A hosted server has one answer: the workspace's key. */
  setPreference?(preference: InferencePreference): Promise<InferenceStatus>
  setLocalModel?(model: LocalModel): Promise<InferenceStatus>
}

export type BreakerState =
  | { kind: 'open' }
  | {
      kind: 'tripped'
      /** Which limit: a dollar cap the person set, or the turn cap behind it. */
      reason: 'spend' | 'turns'
      day: string
      costUsd: number
      capUsd: number
      turns: number
      turnCap: number
    }
  | { kind: 'paused'; day: string }

export interface AgentSpendReport {
  day: string
  costUsd: number
  /** Notional cost a local Claude plan absorbed today. */
  savedUsd: number
  turns: number
  capUsd: number
  turnCap: number
  paused: boolean
}

export interface AgentActivity extends AgentSpendReport {
  /** `needs_you` wins over `working`: a turn waiting on a person is not busy, it is stuck. */
  state: 'idle' | 'working' | 'needs_you' | 'paused'
}

/** Who is asking. The route stamps this; a caller never supplies its own origin. */
export interface Caller {
  origin: CapabilityOrigin
  actorId?: string | null
  /** The turn an agent call runs in: a page it opens is shown only to that chat. */
  sessionId?: string
}

export interface AskOptions {
  attachments?: AttachmentRef[]
  /** Who asked (D65). A routine leaves it out and reads only workspace pages. */
  viewer?: Viewer
}

export interface SessionOptions {
  model?: string | null
  effort?: Effort | null
  approvals?: ApprovalMode | null
}

export interface AgentHostEvents {
  update: (sessionId: string, entry: TranscriptEntry) => void
  /** Washi renamed the conversation; the list should refetch. */
  sessionChanged?: (sessionId: string) => void
  approval: (request: ApprovalRequest) => void
  /** Only a client showing that chat moves; a handover also moves the chat there (D110). */
  openSheet: (id: string, sessionId: string, handover?: boolean) => void
}

export type EventsRef = () => AgentHostEvents | null

export interface TurnSummary {
  sessionId: string
  sessionTitle: string
  /** What the person asked, trimmed for a list. */
  prompt: string
  /** Distinct tools the turn touched, in order. */
  tools: string[]
  receipt: Extract<AgentUpdate, { kind: 'turn_done' }>
  /** Wall-clock ms of the receipt. */
  at: number
}

export interface TodayReport {
  turns: TurnSummary[]
  pending: ApprovalRequest[]
  spend: AgentSpendReport
}

/** The workspace's Exa key, or null when nobody has set one. */
export type SearchKeyLookup = () => Promise<string | null>

export type ApprovalMode = (typeof APPROVAL_MODES)[number]
export type ResumeBy = (typeof RESUME_BY)[number]
export type Effort = (typeof EFFORTS)[number]
export type SdkEffort = (typeof SDK_EFFORT)[Effort]

/** What Settings → Agent edits beside the stop. The zone is the server's: nothing to set yet. */
export interface AgentSettingsReport {
  capUsd: number
  turnCap: number
  resumeBy: ResumeBy
  effort: Effort
  enabledModels: EnabledModel[] | null
  zone: string
  approvalMode: ApprovalMode
  yoloAllowed: boolean
}

export interface TurnLimits {
  quietMs: number
  graceMs: number
}

/** One running turn. `ended` once its `turn_done` landed: whatever the port says later is dropped. */
export interface RunningTurn {
  abort: AbortController
  ended: boolean
}
