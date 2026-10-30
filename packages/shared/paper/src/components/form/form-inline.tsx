import { addModeOf } from '../../lib'
import { usePaperHost } from '../../provider'
import { useDatabase } from '../database'
import { FormBody } from './form-body'
import { FormUnavailable } from './form-unavailable'
import type { FormInlineProps } from './lib'

/** A read-only link draws no form at all; one that takes suggestions draws it to suggest. */
export function FormInline({ table, ...rest }: FormInlineProps) {
  const host = usePaperHost()
  const db = useDatabase(table, 'write')
  if (!addModeOf(host)) return null
  if (db === null || db === 'unreadable' || db === 'missing') {
    return <FormUnavailable db={db} table={table} />
  }
  return <FormBody db={db} {...rest} />
}
