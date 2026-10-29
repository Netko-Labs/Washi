import { useState } from 'react'
import { useData } from '../../../../data'
import { usePaperHost } from '../../../../provider'
import { useRow } from '../../../../state'
import type { FieldBinding } from '../types'

export function useField(field: string, table?: string, row?: string): FieldBinding {
  const host = usePaperHost()
  const { refresh } = useData()
  const scoped = useRow()
  const rowId = row ?? (scoped?.id as string | undefined)
  const initial = scoped?.[field] ?? null
  const [value, setValue] = useState<string>(initial === null ? '' : String(initial))
  const [error, setError] = useState<string | null>(null)

  const commit = async (next: string | number | boolean) => {
    if (!table || !rowId) return setError('this field is not bound to a row')
    try {
      await host.runAction({ verb: 'table.update', table, row: rowId, set: { [field]: next } })
      setError(null)
      refresh()
    } catch (cause) {
      setError(String(cause))
    }
  }

  return { id: `wsx-field-${field}-${rowId ?? 'new'}`, value, setValue, error, commit }
}
