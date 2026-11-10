import { InkError } from '../../errors'
import type { ImportFormat, ImportSource, RefusedRow, SourceRow } from '../types'
import { readCsv, sniffDelimiter } from './csv'
import { readJson, sourceRowsOf } from './json'

/** A file's format read off its type or name, when the caller did not say. */
export function formatOf(mime: string, name: string): ImportFormat | undefined {
  const extension = name.split('.').pop()?.toLowerCase() ?? ''
  if (extension === 'tsv' || mime === 'text/tab-separated-values') return 'tsv'
  if (extension === 'jsonl' || extension === 'ndjson' || mime.includes('ndjson')) return 'jsonl'
  if (extension === 'json' || mime === 'application/json') return 'json'
  if (extension === 'csv' || mime === 'text/csv') return 'csv'
  return undefined
}

/** Text that is JSON by its first character, else a separated file. */
const looksJson = (text: string) => /^﻿?\s*[[{]/.test(text)

/** Every name a row uses, in the order they first appear — a JSON file's columns. */
function namesOf(rows: SourceRow[]): string[] {
  const names = new Set<string>()
  for (const row of rows) for (const name of Object.keys(row.fields)) names.add(name)
  return [...names]
}

/**
 * The rows a source holds by their own column names: CSV or TSV (the delimiter given, else read
 * off the first line), one JSON document, JSON Lines, or rows already parsed.
 */
export function readSource(source: ImportSource): {
  names: string[]
  rows: SourceRow[]
  refused: RefusedRow[]
} {
  if (source.rows) {
    const read = sourceRowsOf(source.rows)
    return { names: namesOf(read.rows), ...read }
  }
  const format = source.format ?? (looksJson(source.text) ? 'json' : 'csv')
  if (format === 'json' || format === 'jsonl') {
    const read = readJson(source.text, format === 'jsonl' ? true : undefined)
    return { names: namesOf(read.rows), ...read }
  }
  const delimiter = source.delimiter ?? (format === 'tsv' ? '\t' : sniffDelimiter(source.text))
  if (delimiter.length !== 1 || delimiter === '"' || /[\r\n]/.test(delimiter)) {
    throw new InkError('delimiter is one character: , ; | or a tab')
  }
  const read = readCsv(source.text, delimiter)
  return { names: read.header, rows: read.rows, refused: read.refused }
}
