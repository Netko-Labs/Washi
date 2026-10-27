import { useDatabase } from '../database'
import { FormBody } from './form-body'
import type { FormProps } from './lib'

/** One whole row, typed and added: every input its column's kind, validated where it lands. */
export function Form({ table, ...rest }: FormProps) {
  const db = useDatabase(table)

  if (db === null) {
    return (
      <div className="wsx-empty" data-state="loading" aria-busy>
        Loading…
      </div>
    )
  }
  if (db === 'unreadable' || db === 'missing') {
    return (
      <div className="wsx-empty" data-state="error" role="alert">
        {db === 'missing' ? `There is no table called “${table}”.` : 'This form could not load.'}
      </div>
    )
  }
  return <FormBody db={db} {...rest} />
}
