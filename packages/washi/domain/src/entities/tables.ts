import { type Cell, type QueryRow, tableSpecSchema } from '@washi/ink'
import { z } from 'zod'

export const userTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  spec: tableSpecSchema,
  hlcUpdated: z.string(),
})
export type UserTable = z.infer<typeof userTableSchema>

/** A row page's database row, for the properties above its body. */
export interface RowOf {
  table: UserTable
  row: QueryRow
  /** Titles of the records its relation cells point at, by record id. */
  related: Record<string, string>
}

const snake = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/)
  .max(64)

/** Turn a choice column into a relation to `target`, matching values to its `on` text column. */
export const linkColumnInputSchema = z.object({
  table: snake,
  column: snake,
  target: snake,
  on: snake.optional(),
  create: z.boolean().optional(),
})
export type LinkColumnInput = z.infer<typeof linkColumnInputSchema>

/** A column one write moved; an absent cell reads null. */
export interface RowFieldChange {
  column: string
  from: Cell
  to: Cell
}

/** One write to a row (D78). `by` is a member id, `washi`, or null when nobody kept the author. */
export interface RowChange {
  atMs: number
  by: string | null
  kind: 'created' | 'edited' | 'deleted' | 'restored'
  fields: RowFieldChange[]
}

export interface RowActivity {
  /** Newest first. */
  changes: RowChange[]
  more: boolean
}

export const ROW_ACTIVITY_MAX = 200

export const rowActivityInputSchema = z.object({
  recordId: z.string().min(1),
  limit: z.number().int().min(1).max(ROW_ACTIVITY_MAX).optional(),
})
export type RowActivityInput = z.infer<typeof rowActivityInputSchema>

/** A page that shows a table, as the catalog names it. */
export interface TablePage {
  id: string
  title: string
  icon: string | null
}

/** A live table in the catalog (D109): what it holds, and the readable pages that show it. */
export interface TableCatalogEntry {
  id: string
  name: string
  rows: number
  columns: number
  /** HLC of the last change to its spec or any of its rows. */
  updated: string
  pages: TablePage[]
}

/** A table in the Trash: its rows wait with it, untouched. */
export interface TrashedTable {
  id: string
  name: string
  rows: number
  deletedAt: string
}
