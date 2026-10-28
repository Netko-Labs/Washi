import type { CompiledScript, PaperHost } from '@washi/paper'
import { parse } from '@washi/wsx'
import { api } from '../api'
import { childrenOf } from '../page-tree'
import { useLiveStore } from '../stores/live/live-store'
import { useSheetsStore } from '../stores/sheets/sheets-store'

let listed: { at: number; hosts: Promise<string[]> } | null = null

/** The workspace's embed list, asked once a minute at most; every embed on a page shares it. */
function listedEmbedHosts(): Promise<string[]> {
  if (!listed || Date.now() - listed.at > 60_000) {
    const asked = { at: Date.now(), hosts: api.embeds.hosts.query() }
    listed = asked
    // A failed read is not a list: the next embed asks again instead of trusting an empty one.
    asked.hosts.catch(() => {
      if (listed === asked) listed = null
    })
  }
  return listed.hosts.catch(() => [])
}

const compiled = new Map<string, Promise<CompiledScript>>()

/** The same TSX compiles the same, so a page drawn again never asks twice. */
function compileOnce(source: string): Promise<CompiledScript> {
  let found = compiled.get(source)
  if (!found) {
    found = api.scripts.compile.query({ source })
    compiled.set(source, found)
    found.catch(() => compiled.delete(source))
  }
  return found
}

// Shorter than the embed list's minute: a widget switched off must stop soon on every open page.
const WIDGETS_FRESH_MS = 15_000
let widgets: { at: number; on: Promise<boolean> } | null = null

/** Whether an owner lets pages run widgets; a failed read is not kept. */
function widgetsOn(): Promise<boolean> {
  if (!widgets || Date.now() - widgets.at > WIDGETS_FRESH_MS) {
    const asked = { at: Date.now(), on: api.embeds.widgets.query() }
    widgets = asked
    asked.on.catch(() => {
      if (widgets === asked) widgets = null
    })
  }
  return widgets.on.catch(() => false)
}

/** A new workspace, or a changed list or switch: the next embed or widget asks again. */
export function forgetEmbedHosts(): void {
  listed = null
  widgets = null
}

/** Wires the closed capability surface of rendered sheets to the main process. */
export const paperHost: PaperHost = {
  runQuery: (query) => api.tables.query.query({ query }),

  runHistory: (query) => api.tables.history.query({ query }),

  onDataChange: (listener) => useLiveStore.getState().onData(listener),

  runAction: async (action) => {
    if (action.verb === 'sheet.open' && typeof action.sheet === 'string') {
      void import('../stores').then(({ useViewStore }) =>
        useViewStore.getState().openTab(`note:${action.sheet}`),
      )
      return
    }
    await api.capabilities.runAction.mutate({ action })
  },

  // A page this reader cannot open answers NOT_FOUND (D65): the link keeps its own words.
  resolveSheet: async (id) => {
    const sheet = await api.sheets.get.query({ id }).catch(() => null)
    return sheet ? { title: sheet.title, icon: sheet.icon } : null
  },

  openSheet: (id) =>
    void import('../stores').then(({ useViewStore }) =>
      useViewStore.getState().openTab(`note:${id}`),
    ),

  describePeople: () => api.workspaces.members.query(),

  // The store holds every page this reader may open (D65), so a hub never lists one they cannot.
  listPages: (parentId) =>
    childrenOf(useSheetsStore.getState().sheets, parentId).map(({ id, title, icon, cover }) => ({
      id,
      title,
      icon,
      cover,
    })),

  onPagesChange: (listener) =>
    useSheetsStore.subscribe((state, previous) => {
      if (state.sheets !== previous.sheets) listener()
    }),

  backlinks: async (id) =>
    (await api.sheets.backlinks.query({ id })).map(({ id: page, title, icon, cover }) => ({
      id: page,
      title,
      icon,
      cover,
    })),

  loadSheet: async (id) => {
    const sheet = await api.sheets.get.query({ id }).catch(() => null)
    return sheet ? { title: sheet.title, root: parse(sheet.source) } : null
  },

  compileScript: (source) => compileOnce(source),

  widgetsAllowed: () => widgetsOn(),

  embedAllowed: async (host) => (await listedEmbedHosts()).includes(host),

  newPage: (parentId) => useSheetsStore.getState().createSheet(parentId),

  openRow: (recordId) =>
    void api.tables.openRow
      .mutate({ recordId })
      .then(async ({ sheetId }) => {
        const { useRowOpenerStore, useSheetsStore, useViewStore } = await import('../stores')
        await useSheetsStore.getState().refresh()
        const { opener } = useRowOpenerStore.getState()
        if (opener) opener(sheetId)
        else useViewStore.getState().openTab(`note:${sheetId}`)
      })
      .catch(async (cause: unknown) => {
        const { useNoticeStore } = await import('../stores')
        const reason = cause instanceof Error ? cause.message : String(cause)
        useNoticeStore.getState().say(`That row did not open — ${reason}`)
      }),

  newRow: async (table, data) => {
    try {
      const { id } = await api.tables.mutate.mutate({ mutation: { kind: 'insert', table, data } })
      if (id) paperHost.openRow?.(id)
    } catch (cause) {
      const { useNoticeStore } = await import('../stores')
      const reason = cause instanceof Error ? cause.message : String(cause)
      useNoticeStore.getState().say(`That row was not added — ${reason}`)
    }
  },

  toggleTask: async (recordId, done, field) => {
    await api.tables.toggleTask.mutate({ recordId, done, field })
  },

  describeTable: async (name) => {
    const tables = await api.tables.list.query()
    return tables.find((table) => table.spec.name === name)?.spec ?? null
  },

  locale: typeof navigator === 'undefined' ? 'en-US' : navigator.language,
}
