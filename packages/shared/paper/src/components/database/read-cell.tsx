import { CardValue } from './card-value'
import type { CardValueProps } from './lib'

/** A cell a read-only link draws (D132): its value as a card reads it, a tick for a yes, else blank. */
export function ReadCell({ db, column, value }: CardValueProps) {
  return (
    <span className="wsx-db-read">
      {column.type === 'boolean' ? (
        value === true ? (
          <>
            <span aria-hidden>✓</span>
            <span className="wsx-sr-only">yes</span>
          </>
        ) : null
      ) : (
        <CardValue db={db} column={column} value={value} />
      )}
    </span>
  )
}
