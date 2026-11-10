import type { Cell, RecordData } from '@washi/ink'

/** A cell made ready for its column, or why it cannot be; `skip` leaves the cell unset. */
export type Coerced = { value: Cell } | { skip: true } | { why: string }

/** How a file's words are laid out: comma or tab separated, one JSON document, or JSON Lines. */
export type ImportFormat = 'csv' | 'tsv' | 'json' | 'jsonl'

/** One source row as read, before it meets the table: its fields by the file's own names. */
export interface SourceRow {
  /** 1-based, counting data rows only (a header is not a row). */
  row: number
  /** The line it starts on in a CSV/TSV or JSON Lines file, header included; absent in JSON. */
  line?: number
  fields: Record<string, unknown>
}

/** What an import is handed: the text and how to read it. */
export interface ImportSource {
  text: string
  format?: ImportFormat
  /** A CSV's separator when it is not a comma or a tab (`;` in many European exports). */
  delimiter?: string
  /** Already-parsed JSON, when the caller sent rows rather than text. */
  rows?: unknown[]
}

/** A source row the table will not take, and why — said with where it was in the file. */
export interface RefusedRow {
  row: number
  line?: number
  why: string
}

/** A source row made ready for the table. */
export interface ReadyRow {
  row: number
  data: RecordData
}

/** The file's columns laid onto the table's: what each became, and what was left out. */
export interface ColumnPlan {
  /** Source name → table column. */
  columns: Record<string, string>
  /** Source names that land nowhere, each with why (no such column, computed, an id). */
  ignored: { column: string; why: string }[]
}

/** One slice of ≤ 500 rows, written all or nothing. */
export interface ImportBatch {
  /** Source rows (1-based) the batch held, first and last. */
  from: number
  to: number
  inserted?: number
  error?: string
}

export interface ImportOptions {
  /** Source column → table column; null leaves a source column out on purpose. */
  map?: Record<string, string | null>
  /** Read, match and check every row, but write nothing. */
  dryRun?: boolean
}

export interface ImportResult {
  table: string
  dryRun: boolean
  /** Rows read from the file. */
  read: number
  inserted: number
  /** The new rows' ids in file order — the first `IDS_SHOWN`; `idsTotal` says how many in all. */
  ids: string[]
  idsTotal: number
  refused: RefusedRow[]
  /** How many were refused in all, when more than `REFUSED_SHOWN` are. */
  refusedTotal: number
  batches: ImportBatch[]
  columns: Record<string, string>
  ignoredColumns: { column: string; why: string }[]
  /** A dry run's count of rows it would write. */
  wouldInsert?: number
  /** A dry run's first rows as they would land. */
  sample?: Record<string, unknown>[]
}

/** One CSV record as RFC 4180 splits it, with the line it starts on. */
export interface CsvRecord {
  line: number
  cells: string[]
}

/** What reading a file gives: the rows it holds, and those refused while reading. */
export interface ReadRows {
  rows: SourceRow[]
  refused: RefusedRow[]
}

/** A CSV or TSV file read: its header's names beside its rows. */
export interface ReadCsv extends ReadRows {
  header: string[]
}

/** Any source read: the names its rows use, in order, beside its rows. */
export interface ReadSource extends ReadRows {
  names: string[]
}

/** What the batched writes gave: the ids made, and each batch's outcome. */
export interface WrittenBatches {
  ids: string[]
  batches: ImportBatch[]
}
