import { IconDatabaseEdit, IconTablePlus } from '@tabler/icons-react'
import type { ToolDescription } from '../types'
import { base, record, rowLabel, text } from './shared'

export function describeTable(name: string, input: Record<string, unknown>): ToolDescription {
  if (name === 'db_define') {
    const spec = record(input.spec)
    const columns = Array.isArray(spec.columns)
      ? spec.columns.map((column) => text(record(column).name)).filter(Boolean)
      : []
    return base({
      icon: IconTablePlus,
      action: 'Create a table',
      subject: text(spec.name),
      details: columns.length ? [`Columns: ${columns.join(', ')}`] : [],
    })
  }
  if (name === 'db_change_column') return describeColumnChange(record(input.change))
  const mutation = record(input.mutation)
  const table = text(mutation.table)
  const label = rowLabel(record(mutation.data))
  if (mutation.kind === 'insert' && Array.isArray(mutation.data)) {
    const count = mutation.data.length
    return base({
      icon: IconDatabaseEdit,
      action: count === 1 ? 'Add a row to' : `Add ${count} rows to`,
      subject: table,
    })
  }
  if (mutation.kind === 'insert') {
    return base({
      icon: IconDatabaseEdit,
      action: label ? `Add “${label}” to` : 'Add a row to',
      subject: table,
    })
  }
  if (mutation.kind === 'delete') {
    return base({ icon: IconDatabaseEdit, action: 'Remove rows from', subject: table })
  }
  if (mutation.kind === 'copy') {
    const changed = Object.keys(record(mutation.set))
    return base({
      icon: IconDatabaseEdit,
      action: 'Copy rows forward in',
      subject: table,
      details: changed.length ? [`Each copy changes ${changed.join(', ')}`] : [],
    })
  }
  const fields = Object.keys(record(mutation.data))
  return base({
    icon: IconDatabaseEdit,
    action: 'Update rows in',
    subject: table,
    details: fields.length ? [`Changes ${fields.join(', ')}`] : [],
  })
}

/** One column renamed, removed or given another option, in words. */
function describeColumnChange(change: Record<string, unknown>): ToolDescription {
  const column = text(change.column) ?? 'a column'
  const subject = text(change.table)
  if (change.kind === 'rename') {
    return base({
      icon: IconTablePlus,
      action: `Rename ${column} to ${text(change.to) ?? '…'} in`,
      subject,
    })
  }
  if (change.kind === 'remove') {
    return base({ icon: IconTablePlus, action: `Remove ${column} from`, subject })
  }
  const [from, to] = [text(change.from), text(change.to)]
  const what =
    from && to
      ? `Rename the option ${from} to ${to}`
      : to
        ? `Add the option ${to}`
        : `Remove the option ${from ?? ''}`
  return base({ icon: IconTablePlus, action: `${what.trim()} to ${column} in`, subject })
}
