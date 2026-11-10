import { InkError } from '../../errors'
import type { RefusedRow, SourceRow } from '../types'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The rows a JSON document holds: an array of objects, or `{ rows: [...] }` (also `data`, `records`). */
function rowsOf(document: unknown): unknown[] {
  if (Array.isArray(document)) return document
  if (isObject(document)) {
    for (const key of ['rows', 'data', 'records', 'items']) {
      const held = document[key]
      if (Array.isArray(held)) return held
    }
  }
  throw new InkError('expected a JSON array of objects, or { "rows": [ … ] }')
}

/** Parsed JSON rows as source rows; anything that is not an object is refused in words. */
export function sourceRowsOf(
  items: unknown[],
  lines?: number[],
): { rows: SourceRow[]; refused: RefusedRow[] } {
  const rows: SourceRow[] = []
  const refused: RefusedRow[] = []
  for (const [index, item] of items.entries()) {
    const row = index + 1
    const line = lines?.[index]
    const where = line === undefined ? {} : { line }
    if (isObject(item)) rows.push({ row, ...where, fields: item })
    else refused.push({ row, ...where, why: 'expected an object of column → value' })
  }
  return { rows, refused }
}

/** JSON Lines: one object a line, blank lines skipped; a line that does not parse is refused. */
function readJsonLines(text: string): { rows: SourceRow[]; refused: RefusedRow[] } {
  const items: unknown[] = []
  const lines: number[] = []
  const refused: RefusedRow[] = []
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    if (!raw.trim()) continue
    try {
      items.push(JSON.parse(raw))
      lines.push(index + 1)
    } catch {
      refused.push({ row: items.length + refused.length + 1, line: index + 1, why: 'not JSON' })
    }
  }
  const read = sourceRowsOf(items, lines)
  return { rows: read.rows, refused: [...refused, ...read.refused] }
}

/**
 * JSON text as rows: one document (an array, or an object holding one), or JSON Lines when
 * `lines` says so — or when the whole will not parse but its first line does.
 */
export function readJson(
  text: string,
  lines: boolean | undefined,
): { rows: SourceRow[]; refused: RefusedRow[] } {
  const body = text.replace(/^﻿/, '')
  if (lines) return readJsonLines(body)
  try {
    return sourceRowsOf(rowsOf(JSON.parse(body)))
  } catch (cause) {
    if (cause instanceof InkError) throw cause
    const first = body.trim().split(/\r?\n/, 1)[0] ?? ''
    if (lines === undefined && first.trim().startsWith('{')) {
      try {
        JSON.parse(first)
        return readJsonLines(body)
      } catch {}
    }
    throw new InkError(`not JSON: ${cause instanceof Error ? cause.message : String(cause)}`)
  }
}
