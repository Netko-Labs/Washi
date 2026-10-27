import { useDatabase } from '../database'
import { FormBody } from './form-body'
import { FormUnavailable } from './form-unavailable'
import type { FormInlineProps } from './lib'

export function FormInline({ table, ...rest }: FormInlineProps) {
  const db = useDatabase(table)
  if (db === null || db === 'unreadable' || db === 'missing') {
    return <FormUnavailable db={db} table={table} />
  }
  return <FormBody db={db} {...rest} />
}
