import {
  IconBell,
  IconBolt,
  IconChartLine,
  IconDatabase,
  IconEye,
  IconFilePencil,
  IconFilePlus,
  IconFileSearch,
  IconHistory,
  IconLink,
  IconMessageForward,
  IconPencil,
  IconPhoto,
  IconSearch,
  IconTable,
  IconTool,
  IconTrash,
  IconUsers,
  IconWorld,
  IconWorldSearch,
} from '@tabler/icons-react'
import type { TitleOf, ToolDescription } from '../types'
import { DRAWN, PAST_TENSE } from '../values'
import { base, hostOf, record, text } from './shared'
import { describeTable } from './tables'

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
    case 'sheet_edit': {
      const edits = Array.isArray(args.edits) ? args.edits.length : 0
      return base({
        icon: IconFilePencil,
        action: 'Update the page',
        subject: text(args.title) ?? sheetTitle() ?? outputTitle(output),
        details: edits ? [edits === 1 ? 'One change' : `${edits} changes`] : [],
      })
    }
    case 'sheet_delete': {
      const title = sheetTitle() ?? outputTitle(output)
      return base({
        icon: IconTrash,
        action: title ? `Moved “${title}” to the trash` : 'Moved a page to the trash',
      })
    }
    case 'db_trash_table': {
      const table = text(args.table)
      return base({
        icon: IconTrash,
        action: table ? `Moving “${table}” to the trash` : 'Moving a table to the trash',
      })
    }
    case 'db_define':
    case 'db_change_column':
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
    case 'unsplash_search':
      return base({
        icon: IconPhoto,
        action: 'Search Unsplash for',
        subject: text(args.query) ? `“${String(args.query)}”` : null,
        details: [],
        outbound: true,
      })
    case 'unsplash_use':
      return base({
        icon: IconPhoto,
        action: 'Picked a photo from',
        subject: 'Unsplash',
        details: text(args.id) ? [`unsplash.com/photos/${String(args.id)}`] : [],
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
    case 'wsx_reference':
      return base({ icon: IconFileSearch, action: 'Read how pages are written' })
    case 'catalog_list':
      return base({ icon: IconPhoto, action: 'Looked at the icons and covers' })
    case 'file_upload':
      return base({ icon: IconPhoto, action: 'Upload', subject: text(args.filename) })
    case 'image_render':
      return base({
        icon: IconPhoto,
        action: 'Draw',
        subject: DRAWN[String(args.purpose)] ?? 'a picture',
      })
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

/** The table a finished `db_trash_table` moved, by the id its answer carries — its Restore. */
export function trashedTableId(name: string, output: string | null | undefined): string | null {
  if (name !== 'db_trash_table' || !output) return null
  try {
    return text(record(JSON.parse(output)).id)
  } catch {
    return null
  }
}

/** A finished call's words: "Create a page" → "Made a page". */
export function pastTense(action: string): string {
  const [verb = '', ...rest] = action.split(' ')
  const past = Object.hasOwn(PAST_TENSE, verb) ? PAST_TENSE[verb] : undefined
  return past ? [past, ...rest].join(' ') : action
}
