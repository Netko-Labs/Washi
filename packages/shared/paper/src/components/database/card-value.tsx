import { formatNumber } from '../../lib'
import { usePaperHost } from '../../provider'
import { ChoiceLook } from './choice-cell'
import { type CardValueProps, choicesFor, dateLabel } from './lib'

const CHOICE = new Set(['select', 'status', 'person'])

/** A property on a gallery card, read-only: a pill, a step, a face, a date, or the plain value. */
export function CardValue({ db, column, value }: CardValueProps) {
  const { locale } = usePaperHost()
  if (value === null || value === undefined || value === '' || value === false) return null
  if (CHOICE.has(column.type) && typeof value === 'string') {
    const choices = choicesFor(column, db.people)
    const index = choices.findIndex((choice) => choice.value === value)
    const label = choices[index]?.label ?? value
    return <ChoiceLook column={column} value={value} label={label} index={index} />
  }
  if (Array.isArray(value)) {
    const choices = choicesFor(column, db.people)
    return (
      <span className="wsx-db-card-pills">
        {value.map((item) => {
          const index = choices.findIndex((choice) => choice.value === String(item))
          return (
            <ChoiceLook
              key={String(item)}
              column={{ ...column, type: 'select' }}
              value={String(item)}
              label={column.type === 'relation' ? '↗' : (choices[index]?.label ?? String(item))}
              index={index}
            />
          )
        })}
      </span>
    )
  }
  if (column.type === 'date' && typeof value === 'string') {
    const [start = '', end = ''] = value.split('/')
    return <span className="wsx-db-card-text">{dateLabel(start, end, locale)}</span>
  }
  if (column.type === 'boolean') return <span className="wsx-db-card-text">✓ {column.name}</span>
  if (typeof value === 'number') {
    return <span className="wsx-db-card-text">{formatNumber(value, locale, column.format)}</span>
  }
  return <span className="wsx-db-card-text">{String(value)}</span>
}
