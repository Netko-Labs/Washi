import { statusOptions } from '@washi/ink'
import { useData } from '../../../../data'
import { formatNumber, resolveRowDeep, useRunAction, useTableSpec } from '../../../../lib'
import type { ActionRef, Row } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import { cell } from '../../../states'
import type { CardActions } from '../types'
import { substitute } from '../utils'

export function useCardActions(onOpen: ActionRef | undefined, table: string): CardActions {
  const host = usePaperHost()
  const run = useRunAction()
  const { refresh } = useData()
  const look = useTableSpec(table)
  const columnOf = (name?: string) => look.spec?.columns.find((each) => each.name === name)
  return {
    locale: host.locale,
    openable: Boolean(onOpen ?? host.openRow),
    open: (row: Row) => {
      if (onOpen) void run(resolveRowDeep(onOpen as never, row) as never)
      else if (typeof row.id === 'string') host.openRow?.(row.id)
    },
    // The spec, once read, says what a cell means: a person by name, a number in its format.
    shown: (value, column) => {
      const spec = columnOf(column)
      if (typeof value === 'number') return formatNumber(value, host.locale, spec?.format)
      if (spec?.type === 'person' && typeof value === 'string') {
        return look.people.find((person) => person.id === value)?.name ?? value
      }
      return cell(value, host.locale)
    },
    optionsOf: (column) => {
      const spec = columnOf(column)
      if (!spec) return []
      return spec.type === 'status' ? statusOptions(spec) : (spec.options ?? [])
    },
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
