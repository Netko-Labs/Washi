import type { PaperHost } from '@washi/paper'
import { api } from './rpc'

/** Wires the closed capability surface of rendered sheets to the main process. */
export const paperHost: PaperHost = {
  runQuery: (query) => api.tables.query.query({ query }),

  runAction: async (action) => {
    if (action.verb === 'sheet.open' && typeof action.sheet === 'string') {
      void import('@/stores/view/view-store').then(({ useViewStore }) =>
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
    void import('@/stores/view/view-store').then(({ useViewStore }) =>
      useViewStore.getState().openTab(`note:${id}`),
    ),

  toggleTask: async (recordId, done) => {
    await api.tables.toggleTask.mutate({ recordId, done })
  },

  describeTable: async (name) => {
    const tables = await api.tables.list.query()
    return tables.find((table) => table.spec.name === name)?.spec ?? null
  },

  locale: navigator.language,
}
