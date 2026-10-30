import { useState } from 'react'
import { usePaperHost } from '../../../../provider'
import type { ColumnChange, ColumnSpec, OptionRemoval } from '../types'
import { OPTION_USE_LIMIT } from '../values'

/** An option no row holds goes at once; one in use asks first, saying how many rows hold it. */
export function useOptionRemoval(
  table: string,
  column: ColumnSpec,
  run: (change: ColumnChange) => Promise<boolean>,
) {
  const host = usePaperHost()
  const [asking, setAsking] = useState<OptionRemoval | null>(null)
  const remove = (option: string) =>
    run({ kind: 'option', table, column: column.name, from: option })

  const ask = async (option: string) => {
    const op = column.type === 'multi_select' ? 'contains' : 'eq'
    const count = await host
      .runQuery({
        table,
        where: [{ column: column.name, op, value: option }],
        limit: OPTION_USE_LIMIT,
      })
      .then((result) => result.rows.length)
      .catch(() => null)
    if (count === 0) return void remove(option)
    setAsking({ option, count })
  }

  const confirm = async () => {
    if (asking && (await remove(asking.option))) setAsking(null)
  }

  return { asking, ask, confirm, cancel: () => setAsking(null) }
}
