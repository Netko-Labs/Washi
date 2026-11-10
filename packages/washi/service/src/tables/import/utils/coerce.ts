import { type ColumnSpec, statusOptions } from '@washi/ink'
import { FALSE_WORDS, TRUE_WORDS } from '../constants'
import type { Coerced } from '../types'
import { parseNumber } from './numbers'

const isEmpty = (value: unknown) =>
  value === undefined || value === null || (typeof value === 'string' && value.trim() === '')

const shown = (value: unknown) => {
  const text = typeof value === 'string' ? value : JSON.stringify(value)
  return `"${text.length > 40 ? `${text.slice(0, 40)}…` : text}"`
}

/** Words for a text-like cell: a number or a boolean as written, a list joined, an object as JSON. */
function asText(value: unknown, trim: boolean): string {
  if (typeof value === 'string') return trim ? value.trim() : value
  if (Array.isArray(value)) return value.map((each) => asText(each, true)).join(', ')
  if (typeof value === 'object') return JSON.stringify(value)
  return String(value)
}

/** One of the column's choices, matched case-blind and spelt as the column spells it. */
function choiceOf(options: string[], written: string): string {
  const wanted = written.trim().toLowerCase()
  return options.find((option) => option.toLowerCase() === wanted) ?? written.trim()
}

/** A list cell: an array, or words split on commas or semicolons; empties and repeats dropped. */
function listOf(value: unknown, options?: string[]): string[] {
  const items = Array.isArray(value)
    ? value.map((each) => asText(each, true))
    : String(value).split(/[;,]/)
  const out: string[] = []
  for (const item of items) {
    const entry = options ? choiceOf(options, item) : item.trim()
    if (entry && !out.includes(entry)) out.push(entry)
  }
  return out
}

function asNumber(value: unknown): Coerced {
  if (typeof value === 'number') return Number.isFinite(value) ? { value } : { why: 'not a number' }
  if (typeof value === 'string') {
    const parsed = parseNumber(value)
    return parsed === null ? { why: `${shown(value)} is not a number` } : { value: parsed }
  }
  return { why: `${shown(value)} is not a number` }
}

function asBoolean(value: unknown): Coerced {
  if (typeof value === 'boolean') return { value }
  if (value === 1 || value === 0) return { value: value === 1 }
  const word = String(value).trim().toLowerCase()
  if (TRUE_WORDS.has(word)) return { value: true }
  if (FALSE_WORDS.has(word)) return { value: false }
  return { why: `${shown(value)} is not yes or no (true/false, yes/no, 1/0, ✓)` }
}

/**
 * A file's value made ready for one column of the table: numbers as people write them, yes/no
 * words, choices spelt as the column spells them, lists split. An empty cell is left unset. What
 * still does not fit (an option the column lacks, a date it cannot read) is left for the table's
 * own check to refuse in its words.
 */
export function coerceCell(column: ColumnSpec, value: unknown): Coerced {
  if (isEmpty(value)) return { skip: true }
  switch (column.type) {
    case 'number':
      return asNumber(value)
    case 'boolean':
      return asBoolean(value)
    case 'select':
      return { value: choiceOf(column.options ?? [], asText(value, true)) }
    case 'status':
      return { value: choiceOf(statusOptions(column), asText(value, true)) }
    case 'multi_select':
      return { value: listOf(value, column.options ?? []) }
    case 'relation':
      return { value: listOf(value) }
    case 'text':
      return { value: asText(value, false) }
    default:
      // date, url, person: their words, trimmed; the table checks the shape.
      return { value: asText(value, true) }
  }
}
