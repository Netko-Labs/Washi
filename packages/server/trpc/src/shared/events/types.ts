import type { ApprovalRequest, TranscriptEntry } from '@washi/domain'

/**
 * Develop-menu commands only the client can carry out — onboarding and identity
 * live in its local storage, and a reload has to happen in the webview.
 */
export type DevCommand = 'reload' | 'reset-onboarding' | 'reset-identity' | 'clear-local-state'

/**
 * One bus serves every workspace on the server, so every workspace-scoped event
 * names its workspace and a subscription only ever yields its own.
 */
export interface WashiEvents {
  agentUpdate: { workspaceId: string; sessionId: string; entry: TranscriptEntry }
  approvalRequested: ApprovalRequest & { workspaceId: string }
  openSheetRequested: { workspaceId: string; id: string }
  devCommand: { command: DevCommand }
}

export type EventName = keyof WashiEvents

export interface Tracked<T> {
  id: string
  data: T
}

export interface EventBus {
  emit<K extends EventName>(name: K, payload: WashiEvents[K]): void
  /** Replays from `lastEventId` when it is still in the buffer, then streams live. */
  subscribe<K extends EventName>(
    name: K,
    options?: { lastEventId?: string | null; signal?: AbortSignal },
  ): AsyncGenerator<Tracked<WashiEvents[K]>>
}
