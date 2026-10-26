import { resolveRowDeep, useRunAction } from '../../../../lib'
import type { ActionRef, Row } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { cell } from '../../../states'
import type { CardActions } from '../types'
import { substitute } from '../utils'

export function useCardActions(onOpen: ActionRef | undefined): CardActions {
  const host = usePaperHost()
  const run = useRunAction()
  return {
    openable: Boolean(onOpen ?? host.openRow),
    open: (row: Row) => {
      if (onOpen) void run(resolveRowDeep(onOpen as never, row) as never)
      else if (typeof row.id === 'string') host.openRow?.(row.id)
    },
    shown: (value) => (typeof value === 'number' ? value.toLocaleString(host.locale) : cell(value)),
    add: (action, group) => void run(substitute(action, group)),
  }
}
