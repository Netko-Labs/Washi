import { useData } from '../../../../data'
import { resolveRowDeep, useRunAction } from '../../../../lib'
import type { ActionRef, Row } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { cell } from '../../../states'
import type { CardActions } from '../types'
import { substitute } from '../utils'

export function useCardActions(onOpen: ActionRef | undefined): CardActions {
  const host = usePaperHost()
  const run = useRunAction()
  const { refresh } = useData()
  return {
    locale: host.locale,
    openable: Boolean(onOpen ?? host.openRow),
    open: (row: Row) => {
      if (onOpen) void run(resolveRowDeep(onOpen as never, row) as never)
      else if (typeof row.id === 'string') host.openRow?.(row.id)
    },
    shown: (value) =>
      typeof value === 'number' ? value.toLocaleString(host.locale) : cell(value, host.locale),
    add: (action, group) => void run(substitute(action, group)),
    creatable: Boolean(host.newRow),
    // The host tells the reader why a row was not added; the board only refetches.
    create: (table, data) =>
      void host
        .newRow?.(table, data)
        .catch(() => undefined)
        .finally(refresh),
  }
}
