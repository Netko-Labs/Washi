import { create } from 'zustand'
import { api } from '../../api'
import { useViewStore } from '../view/view-store'
import { rememberChat, rememberedChat } from './chat-memory'
import { subscribeAgent } from './subscriptions'
import type { AgentState, ChatScope } from './types'
import { isTurnLive, pickChat, scopeOfSession, scopeOfTab } from './utils'

let subscriptions: { unsubscribe: () => void }[] | null = null
/** Bumped by reset: a load issued for the last workspace must not land in this one. */
let generation = 0
/** Boot and the panel both call init; the second caller must join the first, not race it. */
let initializing: Promise<void> | null = null
let creating: Promise<string | null> | null = null

const tabOf = (scope: ChatScope) => (scope ? (`note:${scope}` as const) : 'view:dashboard')

export const useAgentStore = create<AgentState>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  transcript: [],
  approvals: [],
  running: false,
  draft: false,
  startDraft: () =>
    set({ draft: true, activeSessionId: null, transcript: [], running: false, moved: null }),
  scope: null,
  moved: null,
  workspaceKey: null,
  bind: (workspaceKey) => set({ workspaceKey }),
  panelOpen: false,
  togglePanel: () => set((state) => ({ panelOpen: !state.panelOpen })),
  docked: true,
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
    subscriptions ??= subscribeAgent({ getState: get, setState: set })
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
    const active = sessions.find((session) => session.id === get().activeSessionId)
    if (active) set({ scope: scopeOfSession(active) })
    else if (!get().activeSessionId && !get().draft && !creating) {
      const scope = scopeOfTab(useViewStore.getState().activeTab)
      await get().followScope(scope === undefined ? get().scope : scope, true)
    }
  },

  followScope: async (scope, force = false) => {
    if (!force && scope === get().scope) return
    set({ scope, moved: null })
    const id = pickChat(get().sessions, scope, rememberedChat(get().workspaceKey, scope))
    if (id) {
      await get().selectSession(id)
      return
    }
    set({ activeSessionId: null, transcript: [], running: false, draft: false })
    if (!scope) return
    const moved = await api.agents.movedFrom.query({ sheetId: scope }).catch(() => null)
    if (get().scope === scope && !get().activeSessionId) set({ moved })
  },

  /**
   * The old conversation stops being active at once, and a send made while the new
   * one is being created joins that creation — otherwise the prompt lands in the old
   * conversation while the screen shows the new, empty one. It is anchored where the panel is;
   * if the person has moved to another place by the time it exists, it waits in its own.
   */
  createSession: async () => {
    set({ activeSessionId: null, transcript: [] })
    creating ??= (async () => {
      const { scope, workspaceKey } = get()
      const session = await api.agents.createSession.mutate({
        title: `Session ${get().sessions.length + 1}`,
        anchor: scope ? { sheetId: scope, scope: 'page' } : null,
      })
      set((state) => ({ sessions: [session, ...state.sessions] }))
      rememberChat(workspaceKey, scope, session.id)
      if (get().scope === scope) await get().selectSession(session.id)
      return session.id
    })().finally(() => {
      creating = null
    })
    return creating
  },

  /** Claims the session before awaiting, so a slower, older selection can never win. */
  selectSession: async (id) => {
    const session = get().sessions.find((each) => each.id === id)
    const scope = session ? scopeOfSession(session) : get().scope
    set({ activeSessionId: id, transcript: [], draft: false, moved: null, scope, running: false })
    if (session) rememberChat(get().workspaceKey, scope, id)
    const transcript = await api.agents.transcript.query({ sessionId: id })
    if (get().activeSessionId === id) set({ transcript, running: isTurnLive(transcript, session) })
  },

  renameSession: async (id, title) => {
    const session = await api.agents.renameSession.mutate({ sessionId: id, title })
    if (session)
      set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? session : s)) }))
  },

  /** The next conversation in this place takes over; none left means a draft here. */
  deleteSession: async (id) => {
    await api.agents.deleteSession.mutate({ sessionId: id })
    const sessions = get().sessions.filter((session) => session.id !== id)
    set({ sessions })
    if (get().activeSessionId === id) {
      set({ activeSessionId: null, transcript: [] })
      await get().followScope(get().scope, true)
    }
  },

  /** The panel goes with the chat: its place opens, and the route's follow finds it there. */
  moveSession: async (id, sheetId) => {
    const session = await api.agents.moveSession.mutate({ sessionId: id, sheetId })
    if (!session) return
    set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? session : s)) }))
    if (get().activeSessionId !== id) return
    set({ scope: sheetId })
    rememberChat(get().workspaceKey, sheetId, id)
    useViewStore.getState().openTab(tabOf(sheetId))
  },

  visitMoved: () => {
    const { moved, workspaceKey } = get()
    if (!moved) return
    rememberChat(workspaceKey, moved.sheetId, moved.sessionId)
    useViewStore.getState().openTab(tabOf(moved.sheetId))
  },

  setSessionOptions: async (patch) => {
    const joined = creating ? await creating : null
    const id = joined ?? get().activeSessionId ?? (await get().createSession())
    if (!id) return
    const session = await api.agents.setSessionOptions.mutate({ sessionId: id, ...patch })
    if (session)
      set((state) => ({ sessions: state.sessions.map((s) => (s.id === id ? session : s)) }))
  },

  sendPrompt: async (text, attachments) => {
    const joined = creating ? await creating : null
    const sessionId = joined ?? get().activeSessionId ?? (await get().createSession())
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
      scope: null,
      moved: null,
    })
  },
}))
