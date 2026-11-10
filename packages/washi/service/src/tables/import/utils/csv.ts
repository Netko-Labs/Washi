import { InkError } from '../../errors'
import type { RefusedRow, SourceRow } from '../types'

const BOM = '﻿'

/** The separator a file uses, read off its first line: a tab, a semicolon, else a comma. */
export function sniffDelimiter(text: string): string {
  const firstLine = text.replace(BOM, '').split(/\r?\n/, 1)[0] ?? ''
  const count = (char: string) => firstLine.split(char).length - 1
  const tabs = count('\t')
  const semis = count(';')
  const commas = count(',')
  if (tabs > 0 && tabs >= commas && tabs >= semis) return '\t'
  if (semis > commas) return ';'
  return ','
}

/**
 * RFC 4180 records: fields split on the delimiter, quoted fields may hold the delimiter, line
 * breaks and `""` for a quote; CRLF, LF or a lone CR end a record. Each record keeps the line it
 * starts on.
 */
export function csvRecords(text: string, delimiter: string): { line: number; cells: string[] }[] {
  const source = text.startsWith(BOM) ? text.slice(1) : text
  const records: { line: number; cells: string[] }[] = []
  let cells: string[] = []
  let cell = ''
  let quoted = false
  let line = 1
  let start = 1
  const endCell = () => {
    cells.push(cell)
    cell = ''
  }
  const endRecord = () => {
    endCell()
    records.push({ line: start, cells })
    cells = []
  }
  for (let at = 0; at < source.length; at++) {
    const char = source[at] as string
    if (quoted) {
      if (char === '"' && source[at + 1] === '"') {
        cell += '"'
        at++
      } else if (char === '"') quoted = false
      else {
        if (char === '\n' || (char === '\r' && source[at + 1] !== '\n')) line++
        cell += char
      }
      continue
    }
    if (char === '"' && cell === '') quoted = true
    else if (char === delimiter) endCell()
    else if (char === '\r' || char === '\n') {
      if (char === '\r' && source[at + 1] === '\n') at++
      endRecord()
      line++
      start = line
    } else cell += char
  }
  if (quoted) throw new InkError(`a quote opened on line ${start} never closes`)
  if (cell !== '' || cells.length > 0) endRecord()
  return records
}

const isBlank = (cells: string[]) => cells.every((cell) => cell.trim() === '')

/**
 * A CSV or TSV file as rows by its header's names. Blank lines are skipped; a row with more
 * non-empty cells than the header has names is refused in words, a short one leaves the rest empty.
 */
export function readCsv(
  text: string,
  delimiter: string,
): { header: string[]; rows: SourceRow[]; refused: RefusedRow[] } {
  const records = csvRecords(text, delimiter).filter((record) => !isBlank(record.cells))
  const [head, ...body] = records
  if (!head) throw new InkError('the file is empty: a header row naming the columns comes first')
  const header = head.cells.map((name) => name.trim())
  const seen = new Set<string>()
  for (const name of header) {
    if (!name) continue
    if (seen.has(name)) throw new InkError(`the header names "${name}" twice`)
    seen.add(name)
  }
  const rows: SourceRow[] = []
  const refused: RefusedRow[] = []
  for (const [index, record] of body.entries()) {
    const row = index + 1
    const extra = record.cells.slice(header.length).filter((cell) => cell.trim() !== '')
    if (extra.length > 0) {
      refused.push({
        row,
        line: record.line,
        why: `${record.cells.length} cells, but the header names ${header.length} — a stray ${delimiter === '\t' ? 'tab' : `"${delimiter}"`} or an unquoted value?`,
      })
      continue
    }
    const fields: Record<string, unknown> = {}
    for (const [at, name] of header.entries()) {
      if (name) fields[name] = record.cells[at] ?? ''
    }
    rows.push({ row, line: record.line, fields })
  }
  return { header: header.filter(Boolean), rows, refused }
}
