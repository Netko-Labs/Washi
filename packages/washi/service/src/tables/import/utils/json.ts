import { InkError } from '../../errors'
import type { ReadRows, RefusedRow, SourceRow } from '../types'
import { refuseOverCap } from './limit'

const isObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === 'object' && value !== null && !Array.isArray(value)

/** The rows a JSON document holds: an array of objects, or `{ rows: [...] }` (also `data`, `records`). */
function rowsOf(document: unknown): unknown[] {
  if (Array.isArray(document)) {
    refuseOverCap(document.length)
    return document
  }
  if (isObject(document)) {
    for (const key of ['rows', 'data', 'records', 'items']) {
      const held = document[key]
      if (Array.isArray(held)) {
        refuseOverCap(held.length)
        return held
      }
    }
  }
  throw new InkError('expected a JSON array of objects, or { "rows": [ … ] }')
}

/**
 * Parsed JSON rows as source rows; anything that is not an object is refused in words. `numbers`
 * gives each item its row in the file when some were left out before (a JSON Lines line that did
 * not parse keeps its own number).
 */
export function sourceRowsOf(items: unknown[], lines?: number[], numbers?: number[]): ReadRows {
  refuseOverCap(items.length)
  const rows: SourceRow[] = []
  const refused: RefusedRow[] = []
  for (const [index, item] of items.entries()) {
    const row = numbers?.[index] ?? index + 1
    const line = lines?.[index]
    const where = line === undefined ? {} : { line }
    if (isObject(item)) rows.push({ row, ...where, fields: item })
    else refused.push({ row, ...where, why: 'expected an object of column → value' })
  }
  return { rows, refused }
}

/**
 * JSON Lines: one object a line, blank lines skipped; a line that does not parse is refused. A
 * row's number is its place among the non-blank lines, so a refused line never shares one.
 */
function readJsonLines(text: string): ReadRows {
  const items: unknown[] = []
  const lines: number[] = []
  const numbers: number[] = []
  const refused: RefusedRow[] = []
  let row = 0
  for (const [index, raw] of text.split(/\r?\n/).entries()) {
    if (!raw.trim()) continue
    row++
    refuseOverCap(row)
    try {
      items.push(JSON.parse(raw))
      lines.push(index + 1)
      numbers.push(row)
    } catch {
      refused.push({ row, line: index + 1, why: 'not JSON' })
    }
  }
  const read = sourceRowsOf(items, lines, numbers)
  return { rows: read.rows, refused: [...refused, ...read.refused] }
}

/**
 * JSON text as rows: one document (an array, or an object holding one), or JSON Lines when
 * `lines` says so — or when the whole will not parse but its first line does.
 */
export function readJson(text: string, lines: boolean | undefined): ReadRows {
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
