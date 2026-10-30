import type { SheetSummary, TranscriptEntry, UserTable } from '@washi/domain'
import { mergeMessageChunks } from '@washi/ui'
import { MAX_STARTERS, NEAR_BOTTOM_PX, RECEIPTS_SHOWN, STARTER_TITLE_CHARS } from './constants'
import type {
  ChatBlock,
  ScrollBox,
  Starter,
  ToolStep,
  TouchedPage,
  TurnPart,
  WashiBlock,
} from './types'
import { GENERIC_STARTERS, MAKE_A_PAGE } from './values'

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === 'object' ? (value as Record<string, unknown>) : {}

const text = (value: unknown): string | null =>
  typeof value === 'string' && value.trim() ? value : null

/** `sheet_create` answers with the sheet it made, as JSON. */
export function createdId(output: string | null): string | null {
  if (!output) return null
  try {
    return text(record(JSON.parse(output)).id)
  } catch {
    return output.match(/"id"\s*:\s*"([^"]+)"/)?.[1] ?? null
  }
}

export function touchedPage(step: ToolStep): TouchedPage | null {
  if (step.status !== 'completed') return null
  const input = record(step.input)
  const title = text(input.title) ?? 'Untitled'
  if (step.name === 'sheet_create') {
    const id = createdId(step.output)
    return id ? { id, title, touch: 'made' } : null
  }
  if (step.name === 'sheet_replace') {
    const id = text(input.id)
    return id ? { id, title, touch: 'changed' } : null
  }
  return null
}

/** One card per page a turn wrote; a page made and then rewritten was made. */
function pagesOf(parts: TurnPart[]): TouchedPage[] {
  const pages = new Map<string, TouchedPage>()
  for (const part of parts) {
    if (part.kind !== 'tools') continue
    for (const step of part.steps) {
      const page = touchedPage(step)
      if (!page) continue
      const known = pages.get(page.id)
      pages.set(page.id, known?.touch === 'made' ? { ...page, touch: 'made' } : page)
    }
  }
  return [...pages.values()]
}

/** A transcript as a conversation: the person's asks, and Washi's turns between them. */
export function chatBlocks(transcript: TranscriptEntry[]): ChatBlock[] {
  const results = new Map<string, { status: ToolStep['status']; output: string | null }>()
  for (const { update } of transcript) {
    if (update.kind !== 'tool_call_update') continue
    const known = results.get(update.toolCallId)
    results.set(update.toolCallId, {
      status: update.status,
      output: update.output || known?.output || null,
    })
  }

  const blocks: ChatBlock[] = []
  let turn: WashiBlock | null = null
  const current = (id: string): WashiBlock => {
    if (!turn) {
      turn = { kind: 'washi', id, parts: [], pages: [] }
      blocks.push(turn)
    }
    return turn
  }

  for (const entry of mergeMessageChunks(transcript)) {
    const { update } = entry
    if (update.kind === 'user_message') {
      blocks.push({
        kind: 'person',
        id: entry.id,
        text: update.text,
        attachments: update.attachments ?? [],
      })
      turn = null
    } else if (update.kind === 'message_chunk') {
      current(entry.id).parts.push({ kind: 'text', id: entry.id, text: update.text })
    } else if (update.kind === 'tool_call') {
      const result = results.get(update.toolCallId)
      const step: ToolStep = {
        id: update.toolCallId,
        name: update.title,
        input: update.input,
        status: result?.status ?? update.status,
        output: result?.output ?? null,
      }
      const parts = current(entry.id).parts
      const last = parts.at(-1)
      if (last?.kind === 'tools') last.steps.push(step)
      else parts.push({ kind: 'tools', id: entry.id, steps: [step] })
    } else if (update.kind === 'handoff') {
      current(entry.id).parts.push({ kind: 'handoff', id: entry.id, handoff: update })
    } else if (update.kind === 'turn_done') {
      if (update.stopReason === 'error') {
        const error = update.error ?? 'The turn failed'
        current(entry.id).parts.push({ kind: 'error', id: entry.id, text: error })
      } else if (update.stopReason === 'cancelled') {
        current(entry.id).parts.push({ kind: 'stopped', id: entry.id })
      }
      turn = null
    }
  }

  for (const block of blocks) {
    if (block.kind === 'washi') block.pages = pagesOf(block.parts)
  }
  return blocks
}

/** "Read Trip Plan · Searched the web" and how many more fold behind them. */
export function receiptSummary(phrases: string[]): { head: string; more: number } {
  return {
    head: phrases.slice(0, RECEIPTS_SHOWN).join(' · '),
    more: Math.max(0, phrases.length - RECEIPTS_SHOWN),
  }
}

const newest = <T extends { hlcUpdated: string }>(items: T[]): T[] =>
  [...items].sort((a, b) => b.hlcUpdated.localeCompare(a.hlcUpdated))

const isNamed = (title: string) => !!title.trim() && title.trim().toLowerCase() !== 'untitled'

/** A title short enough for a starter's chip, cut at a word. */
export function shortTitle(title: string, max = STARTER_TITLE_CHARS): string {
  const plain = title.trim().replace(/\s+/g, ' ')
  if (plain.length <= max) return plain
  const cut = plain.slice(0, max)
  const space = cut.lastIndexOf(' ')
  return `${(space > max / 2 ? cut.slice(0, space) : cut).trimEnd()}…`
}

/** Starters name only what is there (P3): the newest named pages and table, else plain asks. */
export function startersFor(sheets: SheetSummary[], tables: UserTable[]): Starter[] {
  const pages = newest(sheets.filter((sheet) => !sheet.rowOf && isNamed(sheet.title)))
  const [table] = newest(tables)
  const starters: Starter[] = []
  const [latest, previous] = pages
  if (latest) {
    starters.push({
      label: `Summarize ${shortTitle(latest.title)}`,
      prompt: `Summarize ${latest.title}.`,
      sends: true,
      attachments: [{ kind: 'page', id: latest.id, name: latest.title }],
    })
  }
  if (table) {
    const ask = `What changed in ${table.name} this week?`
    starters.push({ label: ask, prompt: ask, sends: true })
  }
  if (previous) {
    starters.push({
      label: `What links to ${shortTitle(previous.title)}?`,
      prompt: `What links to ${previous.title}?`,
      sends: true,
      attachments: [{ kind: 'page', id: previous.id, name: previous.title }],
    })
  }
  if (starters.length === 0) return GENERIC_STARTERS
  return [...starters, MAKE_A_PAGE].slice(0, MAX_STARTERS)
}

export function greetingFor(name: string): string {
  const first = name.trim().split(/\s+/)[0]
  return first ? `What should we work on, ${first}?` : 'What should we work on?'
}

export function isNearBottom(box: ScrollBox, slack = NEAR_BOTTOM_PX): boolean {
  return box.scrollHeight - box.scrollTop - box.clientHeight <= slack
}

/** Pages a finished `sheet_delete` in this run moved to the trash — each gets its Restore. */
export function trashedPages(steps: ToolStep[]): string[] {
  return steps.flatMap((step) => {
    const id = (step.input as { id?: unknown } | undefined)?.id
    return step.name === 'sheet_delete' && step.status === 'completed' && typeof id === 'string'
      ? [id]
      : []
  })
}
