import { useEffect, useState } from 'react'
import { usePaperHost } from '../../../../provider'
import type { Choice } from '../types'
import { titleColumn } from '../utils'

/** The rows a relation can point at, by their titles. */
export function useRelationChoices(target: string | undefined): Choice[] {
  const host = usePaperHost()
  const [choices, setChoices] = useState<Choice[]>([])

  useEffect(() => {
    if (!target) return
    let alive = true
    Promise.all([host.describeTable(target), host.runQuery({ table: target, limit: 500 })]).then(
      ([spec, result]) => {
        const title = spec ? titleColumn(spec)?.name : undefined
        const label = (row: (typeof result.rows)[number]) =>
          title && typeof row[title] === 'string' && row[title] ? String(row[title]) : 'Untitled'
        if (alive)
          setChoices(result.rows.map((row) => ({ value: String(row.id), label: label(row) })))
      },
    )
    return () => {
      alive = false
    }
  }, [host, target])

  return choices
}
