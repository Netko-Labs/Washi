import type { WsxElement, WsxValue } from '@washi/wsx'
import { whereWords, word } from './utils'

const record = (value: WsxValue | undefined): Record<string, WsxValue> =>
  value && typeof value === 'object' && !Array.isArray(value) ? value : {}

/** The table a block reads, off its `bind` or its own `table`. */
export function tableOf(el: WsxElement): string | null {
  return word(record(el.props.bind).table) ?? word(el.props.table)
}

/** "over `backlog` (where status ne Done)": what a bound block reads, in words. */
function overWords(el: WsxElement): string {
  const bind = record(el.props.bind)
  const table = tableOf(el)
  const where = whereWords(bind.where)
  const order = record(bind.orderBy)
  return [
    table ? `over \`${table}\`` : 'over a table',
    where ? `where ${where}` : null,
    word(order.column) ? `by ${word(order.column)}` : null,
  ]
    .filter(Boolean)
    .join(' ')
}

/** A Database's views in words: "By release (table), By area (board)". */
function viewsWords(views: WsxValue | undefined): string | null {
  if (!Array.isArray(views) || views.length === 0) return null
  return views
    .map((view) => {
      const { name, kind } = record(view)
      return `${word(name) ?? 'a view'} (${word(kind) ?? 'table'})`
    })
    .join(', ')
}

const columns = (pairs: [string, WsxValue | undefined][]) =>
  pairs
    .map(([what, value]) => (word(value) ? `${what} ${word(value)}` : null))
    .filter(Boolean)
    .join(', ')

/**
 * A block that draws a table's rows, as one line: what it is, what it reads and how — never the
 * rows themselves (the digest's Tables section holds those once).
 */
export function dataLine(el: WsxElement): string {
  const over = overWords(el)
  const extra = (words: string) => (words ? `; ${words}` : '')
  switch (el.name) {
    case 'Board':
      return `*Board ${over}${word(el.props.groupBy) ? ` grouped by ${word(el.props.groupBy)}` : ''}${extra(columns([['cards titled by', el.props.title]]))}*`
    case 'Database': {
      const views = viewsWords(el.props.views)
      return `*Database \`${tableOf(el) ?? '?'}\`${views ? ` — views: ${views}` : ''}*`
    }
    case 'Roadmap':
      return `*Roadmap ${over}${extra(
        columns([
          ['bars from', el.props.date],
          ['to', el.props.end],
          ['titled by', el.props.title],
        ]),
      )}*`
    case 'Agenda':
      return `*Agenda (${word(el.props.view) ?? 'week'}) ${over}${extra(
        columns([
          ['dated by', el.props.date],
          ['titled by', el.props.title],
        ]),
      )}*`
    case 'Slots':
      return `*Booking slots ${over}${extra(
        columns([
          ['hours', el.props.hours],
          ['minutes', el.props.minutes],
        ]),
      )}*`
    case 'Chart':
      return `*${word(el.props.kind) ?? 'bar'} chart ${over}${extra(
        columns([
          ['label', el.props.label],
          ['value', el.props.value],
        ]),
      )}*`
    case 'Heatmap':
      return `*Heatmap ${over}${extra(columns([['dated by', el.props.date]]))}*`
    case 'Table':
      return `*Table ${over}*`
    case 'Form':
      return `*Form adding a row to \`${tableOf(el) ?? '?'}\`${word(el.props.trigger) ? ` behind "${word(el.props.trigger)}"` : ''}*`
    case 'Compose':
      return `*Compose box: ${word(el.props.label) ?? word(el.props.placeholder) ?? 'write a row'}*`
    case 'Task':
      return `*A row's checkbox*`
    case 'Repeat':
      return `*Repeats its blocks ${over}*`
    case 'Drawer':
      return `*Drawer ${word(el.props.title) ? `"${word(el.props.title)}" ` : ''}${over}*`
    default:
      return `*${el.name} ${over}*`
  }
}
