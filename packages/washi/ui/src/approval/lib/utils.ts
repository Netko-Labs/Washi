import {
  IconBell,
  IconBolt,
  IconChartLine,
  IconDatabase,
  IconDatabaseEdit,
  IconEye,
  IconFilePencil,
  IconFilePlus,
  IconFileSearch,
  IconHistory,
  IconLink,
  IconMessageForward,
  IconPencil,
  IconSearch,
  IconTable,
  IconTablePlus,
  IconTool,
  IconTrash,
  IconUsers,
  IconWorld,
  IconWorldSearch,
} from '@tabler/icons-react'
import type { TitleOf, ToolDescription } from './types'

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null

/** The first readable value of a row — its title, usually. */
function rowLabel(data: Record<string, unknown>): string | null {
  for (const value of Object.values(data)) {
    if (typeof value === 'string' && value.trim()) return value
  }
  return null
}

function hostOf(url: string | null): string | null {
  if (!url) return null
  try {
    return new URL(url).hostname
  } catch {
    return url
  }
}

const base = (partial: Partial<ToolDescription> & Pick<ToolDescription, 'icon' | 'action'>) => ({
  subject: null,
  details: [],
  outbound: false,
  preview: null,
  ...partial,
})

function describeTable(name: string, input: Record<string, unknown>): ToolDescription {
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
  const mutation = record(input.mutation)
  const table = text(mutation.table)
  const label = rowLabel(record(mutation.data))
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

/** A title the call itself returned — what names a page once it is gone from the store. */
function outputTitle(output: string | null | undefined): string | null {
  if (!output) return null
  try {
    return text(record(JSON.parse(output)).title)
  } catch {
    return null
  }
}

/** Every Washi tool, in words. Unknown tools fall back to their name, de-snake-cased. */
export function describeTool(
  name: string,
  input: unknown,
  titleOf: TitleOf,
  output?: string | null,
): ToolDescription {
  const args = record(input)
  const sheetTitle = () => {
    const id = text(args.id)
    return id ? titleOf(id) : null
  }
  switch (name) {
    case 'sheet_create':
      return base({
        icon: IconFilePlus,
        action: 'Create a page',
        subject: text(args.title),
        preview: text(args.source),
      })
    case 'sheet_replace':
      return base({
        icon: IconFilePencil,
        action: 'Update the page',
        subject: text(args.title) ?? sheetTitle(),
        preview: text(args.source),
      })
    case 'sheet_delete': {
      const title = sheetTitle() ?? outputTitle(output)
      return base({
        icon: IconTrash,
        action: title ? `Moved “${title}” to the trash` : 'Moved a page to the trash',
      })
    }
    case 'db_define':
    case 'db_mutate':
      return describeTable(name, args)
    case 'db_link_column': {
      const input = record(args.input)
      return base({
        icon: IconLink,
        action: `Link ${text(input.table) ?? 'a table'}’s ${text(input.column) ?? 'column'} to`,
        subject: text(input.target),
      })
    }
    case 'reminder_create': {
      const days = typeof args.daysBefore === 'number' ? args.daysBefore : 0
      const when = days === 0 ? 'On the day' : days === 1 ? 'A day before' : `${days} days before`
      return base({
        icon: IconBell,
        action: 'Set a reminder',
        subject: text(args.title),
        details: [
          `${when} ${text(args.dateColumn) ?? 'the date'} · ${text(args.table) ?? 'a table'}`,
        ],
      })
    }
    case 'fetch_url':
      return base({
        icon: IconWorld,
        action: 'Visit',
        subject: hostOf(text(args.url)),
        details: text(args.url) ? [String(args.url)] : [],
        outbound: true,
      })
    case 'automation':
      return base({
        icon: IconBolt,
        action: 'Ran an automation on',
        subject: text(args.table),
        details: text(args.title) ? [String(args.title)] : [],
      })
    case 'link_preview':
      return base({
        icon: IconWorld,
        action: 'Read a bookmark from',
        subject: hostOf(text(args.href)),
        details: text(args.href) ? [String(args.href)] : [],
        outbound: true,
      })
    case 'web_search':
      return base({
        icon: IconWorldSearch,
        action: 'Search the web for',
        subject: text(args.query) ? `“${String(args.query)}”` : null,
        details: ['Through Exa'],
        outbound: true,
      })
    case 'action_run': {
      const action = record(args.action)
      return base({ icon: IconBolt, action: 'Run', subject: text(action.verb), outbound: true })
    }
    case 'sheet_list':
      return base({ icon: IconFileSearch, action: 'Looked through your pages' })
    case 'sheet_get':
      return base({ icon: IconEye, action: 'Read', subject: sheetTitle() })
    case 'sheet_check':
      return base({ icon: IconFileSearch, action: 'Checked the page design' })
    case 'sheet_backlinks':
      return base({ icon: IconLink, action: 'Found links to', subject: sheetTitle() })
    case 'search':
      return base({ icon: IconSearch, action: 'Searched for', subject: text(args.term) })
    case 'db_list_tables':
      return base({ icon: IconDatabase, action: 'Looked at your tables' })
    case 'people_list':
      return base({ icon: IconUsers, action: 'Looked at who is on the team' })
    case 'db_query':
      return base({ icon: IconTable, action: 'Read', subject: text(record(args.query).table) })
    case 'db_history':
      return base({
        icon: IconChartLine,
        action: 'Looked back through',
        subject: text(record(args.query).table),
      })
    case 'db_row_activity':
      return base({ icon: IconHistory, action: 'Looked back through a row’s changes' })
    case 'set_conversation_title':
      return base({ icon: IconPencil, action: 'Named the chat', subject: text(args.title) })
    case 'chat_handover':
      return base({
        icon: IconMessageForward,
        action: 'Moved this chat to',
        subject: text(args.sheetId) ? titleOf(String(args.sheetId)) : null,
      })
    default:
      return base({ icon: IconTool, action: name.replaceAll('_', ' ') })
  }
}
