import type { PaperHost } from '@washi/paper'
import { api } from './rpc'

/** Wires the closed capability surface of rendered sheets to the main process. */
export const paperHost: PaperHost = {
  runQuery: (query) => api.queryRecords({ query }),

  runAction: async (action) => {
    if (action.verb === 'sheet.open' && typeof action.sheet === 'string') {
      void import('@/stores/view/view-store').then(({ useViewStore }) =>
        useViewStore.getState().openTab(`note:${action.sheet}`),
      )
      return
    }
    await api.runAction({ action })
  },

  runFetch: (url) => api.fetchUrl({ url }),

  resolveSheet: async (id) => {
    const sheet = await api.getSheet({ id })
    return sheet ? { title: sheet.title, icon: sheet.icon } : null
  },

  openSheet: (id) =>
    void import('@/stores/view/view-store').then(({ useViewStore }) =>
      useViewStore.getState().openTab(`note:${id}`),
    ),

  toggleTask: async (recordId, done) => {
    await api.toggleTask({ recordId, done })
  },
}
