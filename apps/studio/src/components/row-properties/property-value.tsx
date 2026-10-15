import { CHIP, formatDate, type PropertyValueProps, STATUS_CHIP, statusGroup } from './lib'

const EMPTY = <span className="text-muted-foreground/60">Empty</span>

/** One cell, read the way Notion shows it: chips, ranges, names — never ids or JSON. */
export function PropertyValue({ column, value, related, people }: PropertyValueProps) {
  if (value === null || value === undefined || value === '') return EMPTY
  if (Array.isArray(value)) {
    if (value.length === 0) return EMPTY
    const label = (item: string) => (column.type === 'relation' ? (related[item] ?? item) : item)
    return (
      <span className="flex flex-wrap gap-1">
        {value.map((item) => (
          <span key={item} className={`${CHIP} bg-muted`}>
            {label(item)}
          </span>
        ))}
      </span>
    )
  }
  if (typeof value === 'boolean') return <span>{value ? 'Yes' : 'No'}</span>
  if (typeof value === 'number') return <span className="tabular-nums">{value}</span>

  switch (column.type) {
    case 'status':
      return <span className={`${CHIP} ${STATUS_CHIP[statusGroup(column, value)]}`}>{value}</span>
    case 'select':
      return <span className={`${CHIP} bg-muted`}>{value}</span>
    case 'date':
      return <span>{formatDate(value)}</span>
    case 'person':
      return <span>{people[value] ?? 'Someone who left'}</span>
    case 'url':
      return (
        <a href={value} target="_blank" rel="noreferrer" className="underline underline-offset-2">
          {value.replace(/^https?:\/\//, '')}
        </a>
      )
    default:
      return <span>{value}</span>
  }
}
