import { useEffect, useState } from 'react'
import { usePaperHost } from '../../provider'

/** A select column's options, from the table spec — a page never enumerates them. */
export function useSelectOptions(table: string | undefined, field: string): string[] {
  const host = usePaperHost()
  const [options, setOptions] = useState<string[]>([])

  useEffect(() => {
    if (!table) return
    let alive = true
    host.describeTable(table).then((spec) => {
      const column = spec?.columns.find((item) => item.name === field)
      if (alive && column?.options) setOptions(column.options)
    })
    return () => {
      alive = false
    }
  }, [host, table, field])

  return options
}
