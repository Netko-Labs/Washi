import type { FormUnavailableProps } from './lib'

/** What a form shows while its table loads, or when there is no table to add to. */
export function FormUnavailable({ db, table }: FormUnavailableProps) {
  if (db === null) {
    return (
      <div className="wsx-empty" data-state="loading" aria-busy>
        Loading…
      </div>
    )
  }
  return (
    <div className="wsx-empty" data-state="error" role="alert">
      {db === 'missing' ? `There is no table called “${table}”.` : 'This form could not load.'}
    </div>
  )
}
