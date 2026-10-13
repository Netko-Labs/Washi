import type { PaperHost } from '@washi/paper'
import { api } from '@/integrations/trpc'

/**
 * The same closed capability surface the desktop wires up, pointed at a remote
 * server instead of a loopback one. `sheet.open` is a client verb — it becomes
 * navigation here, exactly as it becomes a tab there.
 */
export function createPaperHost(openSheet: (id: string) => void): PaperHost {
  return {
    runQuery: (query) => api.tables.query.query({ query }),

    runAction: async (action) => {
      if (action.verb === 'sheet.open' && typeof action.sheet === 'string') {
        openSheet(action.sheet)
        return
      }
      await api.capabilities.runAction.mutate({ action })
    },

    resolveSheet: async (id) => {
      const sheet = await api.sheets.get.query({ id })
      return sheet ? { title: sheet.title, icon: sheet.icon } : null
    },

    openSheet,

    toggleTask: async (recordId, done) => {
      await api.tables.toggleTask.mutate({ recordId, done })
    },

    describeTable: async (name) => {
      const tables = await api.tables.list.query()
      return tables.find((table) => table.spec.name === name)?.spec ?? null
    },

    locale: navigator.language,
  }
}
