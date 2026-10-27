import type {
  AgentSession,
  ApprovalDecision,
  ApprovalRequest,
  AttachmentRef,
  Effort,
  TranscriptEntry,
} from '@washi/domain'
import { create } from 'zustand'
import { api } from '../../api'
import { useSheetsStore } from '../sheets/sheets-store'

interface AgentState {
  sessions: AgentSession[]
  activeSessionId: string | null
  transcript: TranscriptEntry[]
  approvals: ApprovalRequest[]
  running: boolean
  /** A blank chat on screen: nothing is created until its first send (D67). */
  draft: boolean
  startDraft: () => void
  panelOpen: boolean
  togglePanel: () => void
  /** Docked beside the page instead of floating over it (D61). The host remembers it. */
  docked: boolean
  setDocked: (docked: boolean) => void
  toggleDocked: () => void
  init: () => Promise<void>
  initialize: () => Promise<void>
  createSession: () => Promise<void>
  selectSession: (id: string) => Promise<void>
  renameSession: (id: string, title: string) => Promise<void>
  deleteSession: (id: string) => Promise<void>
  setSessionOptions: (patch: { model?: string | null; effort?: Effort | null }) => Promise<void>
  sendPrompt: (text: string, attachments?: AttachmentRef[]) => Promise<void>
  stopTurn: () => Promise<void>
  resolveApproval: (id: string, decision: ApprovalDecision) => Promise<void>
  reset: () => void
}

let subscriptions: { unsubscribe: () => void }[] | null = null
/** Bumped by reset: a load issued for the last workspace must not land in this one. */
let generation = 0
/** Boot and the panel both call init; the second caller must join the first, not race it. */
let initializing: Promise<void> | null = null
let creating: Promise<void> | null = null

/** Header/panel mascot state from the transcript tail (design: agent status lives in chrome). */
export function mascotStateFor(
  transcript: TranscriptEntry[],
  running: boolean,
  approvals: ApprovalRequest[],
): 'idle' | 'reading' | 'thinking' | 'writing' | 'suggesting' | 'done' | 'flagged' {
  if (approvals.length > 0) return 'suggesting'
  const last = transcript.at(-1)?.update
  if (!running) {
    if (last?.kind === 'turn_done') return last.stopReason === 'error' ? 'flagged' : 'done'
    return 'idle'
  }
  for (let index = transcript.length - 1; index >= 0; index--) {
    const update = transcript[index]?.update
    if (update?.kind === 'tool_call') {
      if (update.toolKind === 'read' || update.toolKind === 'search' || update.toolKind === 'fetch')
        return 'reading'
      if (update.toolKind === 'edit') return 'writing'
      return 'thinking'
    }
    if (update?.kind === 'user_message') break
  }
  return 'thinking'
}

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  transcript: [],
  approvals: [],
  running: false,
  draft: false,
  startDraft: () => set({ draft: true, activeSessionId: null, transcript: [], running: false }),
  panelOpen: false,
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  docked: false,
  setDocked: (docked) => set({ docked }),
  toggleDocked: () => set((state) => ({ docked: !state.docked })),

  init: () => {
    initializing ??= get()
      .initialize()
      .catch((error: unknown) => {
        initializing = null
        throw error
      })
    return initializing
  },

  initialize: async () => {
    if (!subscriptions) {
      subscriptions = []
      const agentUpdates = api.agents.onAgentUpdate.subscribe(undefined, {
        onData: ({ data: { sessionId, entry } }) => {
          const { activeSessionId } = get()
          if (sessionId !== activeSessionId) return
          set((state) => ({
            transcript: [...state.transcript, entry],
            running: entry.update.kind !== 'turn_done' && state.running,
          }))
          if (entry.update.kind === 'turn_done') {
            void useSheetsStore.getState().refresh()
          }
        },
      })
      const approvalRequests = api.agents.onApprovalRequested.subscribe(undefined, {
        onData: ({ data: request }) => {
          set((state) =>
            state.approvals.some((approval) => approval.id === request.id)
              ? state
              : { approvals: [...state.approvals, request] },
          )
        },
      })
      const openSheetRequests = api.agents.onOpenSheetRequested.subscribe(undefined, {
        onData: ({ data: { id } }) => {
          void import('../view/view-store').then(({ useViewStore }) =>
            useViewStore.getState().openTab(`note:${id}`),
          )
          void useSheetsStore.getState().refresh()
        },
      })
      const sessionChanges = api.agents.onSessionChanged.subscribe(undefined, {
        onData: () => {
          void api.agents.listSessions.query().then((sessions) => set({ sessions }))
        },
      })
      subscriptions.push(agentUpdates, approvalRequests, openSheetRequests, sessionChanges)
    }
    const issued = generation
    const [sessions, pending] = await Promise.all([
      api.agents.listSessions.query(),
      api.agents.pendingApprovals.query(),
    ])
    if (issued !== generation) return
    set((state) => ({
      sessions,
      approvals: [
        ...state.approvals,
        ...pending.filter((request) => !state.approvals.some((a) => a.id === request.id)),
      ],
    }))
    // Re-checked after the await: a conversation chosen meanwhile is the person's choice.
    if (!get().activeSessionId && !get().draft && !creating && sessions[0]) {
      await get().selectSession(sessions[0].id)
    }
  },

  /**
   * The old conversation stops being active at once, and a send made while the new
   * one is being created joins that creation — otherwise the prompt lands in the old
   * conversation while the screen shows the new, empty one.
   */
  createSession: async () => {
    set({ activeSessionId: null, transcript: [] })
    creating ??= (async () => {
      const session = await api.agents.createSession.mutate({
        title: `Session ${get().sessions.length + 1}`,
      })
      set((state) => ({ sessions: [session, ...state.sessions] }))
      await get().selectSession(session.id)
    })().finally(() => {
      creating = null
    })
    await creating
  },

  /** Claims the session before awaiting, so a slower, older selection can never win. */
  selectSession: async (id) => {
    set({ activeSessionId: id, transcript: [], draft: false })
    const transcript = await api.agents.transcript.query({ sessionId: id })
    if (get().activeSessionId === id) set({ transcript })
  },

  renameSession: async (id, title) => {
    const session = await api.agents.renameSession.mutate({ sessionId: id, title })
    if (session)
      set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? session : s)) }))
  },

  /** The next conversation in the list takes over; none left means a fresh one on the next ask. */
  deleteSession: async (id) => {
    await api.agents.deleteSession.mutate({ sessionId: id })
    const sessions = get().sessions.filter((session) => session.id !== id)
    set({ sessions })
    if (get().activeSessionId === id) {
      if (sessions[0]) await get().selectSession(sessions[0].id)
      else set({ activeSessionId: null, transcript: [] })
    }
  },

  setSessionOptions: async (patch) => {
    if (creating) await creating
    let id = get().activeSessionId
    if (!id) {
      await get().createSession()
      id = get().activeSessionId
    }
    if (!id) return
    const session = await api.agents.setSessionOptions.mutate({ sessionId: id, ...patch })
    if (session)
      set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? session : s)) }))
  },

  sendPrompt: async (text, attachments) => {
    if (creating) await creating
    let sessionId = get().activeSessionId
    if (!sessionId) {
      await get().createSession()
      sessionId = get().activeSessionId
    }
    if (!sessionId || !text.trim()) return
    set({ running: true })
    try {
      await api.agents.prompt.mutate({
        sessionId,
        text,
        ...(attachments && attachments.length > 0 && { attachments }),
      })
    } catch (error) {
      set({ running: false })
      throw error
    }
  },

  stopTurn: async () => {
    const sessionId = get().activeSessionId
    if (sessionId) await api.agents.cancel.mutate({ sessionId })
  },

  resolveApproval: async (id, decision) => {
    await api.agents.resolveApproval.mutate({ id, decision })
    set((state) => ({ approvals: state.approvals.filter((approval) => approval.id !== id) }))
  },

  /** Another workspace: its sessions, approvals and subscriptions are not this one's. */
  reset: () => {
    for (const subscription of subscriptions ?? []) subscription.unsubscribe()
    subscriptions = null
    initializing = null
    generation += 1
    set({
      sessions: [],
      activeSessionId: null,
      transcript: [],
      approvals: [],
      running: false,
      draft: false,
    })
  },
}))
