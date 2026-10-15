import type { PaperHost } from '@washi/paper'
import { api } from '../api'
import { useLiveStore } from '../stores/live/live-store'

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

  resolveSheet: async (id) => {
    const sheet = await api.sheets.get.query({ id })
    return sheet ? { title: sheet.title, icon: sheet.icon } : null
  },

  openSheet: (id) =>
    void import('../stores').then(({ useViewStore }) =>
      useViewStore.getState().openTab(`note:${id}`),
    ),

  describePeople: () => api.workspaces.members.query(),

  openRow: (recordId) =>
    void api.tables.openRow
      .mutate({ recordId })
      .then(async ({ sheetId }) => {
        const { useSheetsStore, useViewStore } = await import('../stores')
        await useSheetsStore.getState().refresh()
        useViewStore.getState().openTab(`note:${sheetId}`)
      })
      .catch(async (cause: unknown) => {
        const { useNoticeStore } = await import('../stores')
        const reason = cause instanceof Error ? cause.message : String(cause)
        useNoticeStore.getState().say(`That row did not open — ${reason}`)
      }),

  toggleTask: async (recordId, done) => {
    await api.tables.toggleTask.mutate({ recordId, done })
  },

  describeTable: async (name) => {
    const tables = await api.tables.list.query()
    return tables.find((table) => table.spec.name === name)?.spec ?? null
  },

  locale: typeof navigator === 'undefined' ? 'en-US' : navigator.language,
}
