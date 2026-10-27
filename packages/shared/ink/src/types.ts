import { z } from 'zod'

/** Notion's property kinds. Array-valued: `multi_select`, `relation` (record ids). */
export const columnTypeSchema = z.enum([
  'text',
  'number',
  'boolean',
  'date',
  'select',
  'status',
  'multi_select',
  'person',
  'url',
  'relation',
  'formula',
  'rollup',
])
export type ColumnType = z.infer<typeof columnTypeSchema>

const identifier = (what: string) =>
  z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, `${what} names are snake_case identifiers`)

const optionList = z.array(z.string().min(1).max(64)).max(64)

/** A status's options fall into Notion's three groups; `done` is what history counts as shipped. */
export const statusGroupsSchema = z.object({
  todo: optionList.min(1),
  doing: optionList,
  done: optionList.min(1),
})
export type StatusGroups = z.infer<typeof statusGroupsSchema>

export const columnSpecSchema = z
  .object({
    name: identifier('column'),
    type: columnTypeSchema,
    options: optionList.optional(),
    groups: statusGroupsSchema.optional(),
    /** The table a `relation` points at. */
    table: identifier('table').optional(),
    /**
     * A `formula`'s expression over its own row's columns, in the page expr grammar
     * (`month(date)`, `amount * fx_rate`, `when(paid, 0, days(now(), due))`). Computed on every
     * read, never stored.
     */
    expr: z.string().min(1).max(500).optional(),
    /** A `rollup`: one aggregate over another table's rows that point at this one (D74). */
    rollup: z.lazy(() => rollupSpecSchema).optional(),
  })
  .superRefine((column, ctx) => {
    // Stored specs are re-parsed on every read: a rule added here must not orphan an old table.
    const needs = (key: 'groups' | 'table') =>
      column[key] === undefined &&
      ctx.addIssue({ code: 'custom', path: [key], message: `a ${column.type} column needs ${key}` })
    if (column.type === 'status') needs('groups')
    if (column.type === 'relation') needs('table')
    if (column.type === 'formula' && column.expr === undefined) {
      ctx.addIssue({ code: 'custom', path: ['expr'], message: 'a formula column needs expr' })
    }
    if (column.type !== 'formula' && column.expr !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['expr'], message: 'only a formula column has expr' })
    }
    if (column.type === 'rollup' && column.rollup === undefined) {
      ctx.addIssue({ code: 'custom', path: ['rollup'], message: 'a rollup column needs rollup' })
    }
    if (column.type !== 'rollup' && column.rollup !== undefined) {
      ctx.addIssue({ code: 'custom', path: ['rollup'], message: 'only a rollup column has rollup' })
    }
  })
export type ColumnSpec = z.infer<typeof columnSpecSchema>

export const tableSpecSchema = z.object({
  name: identifier('table'),
  columns: z.array(columnSpecSchema).min(1).max(64),
})
export type TableSpec = z.infer<typeof tableSpecSchema>

export const scalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
export type Scalar = z.infer<typeof scalarSchema>

/** A cell: a scalar, or the list a `multi_select` or `relation` holds. */
export const cellSchema = z.union([scalarSchema, z.array(z.string().min(1).max(200)).max(100)])
export type Cell = z.infer<typeof cellSchema>

export const filterOpSchema = z.enum(['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'contains', 'in'])
export type FilterOp = z.infer<typeof filterOpSchema>

export const filterSchema = z.object({
  column: z.string().min(1),
  op: filterOpSchema,
  value: z.union([scalarSchema, z.array(scalarSchema).max(100)]),
})
export type Filter = z.infer<typeof filterSchema>

export const aggregateFnSchema = z.enum(['count', 'sum', 'avg', 'min', 'max'])
export type AggregateFn = z.infer<typeof aggregateFnSchema>

export const aggregateSchema = z.object({
  fn: aggregateFnSchema,
  column: z.string().min(1).optional(),
})
export type Aggregate = z.infer<typeof aggregateSchema>

/** A rollup filter may name a query parameter — `{ param: 'month' }` — the page fills (D74). */
export const paramRefSchema = z.object({ param: identifier('param') }).strict()
export type ParamRef = z.infer<typeof paramRefSchema>

export const rollupFilterSchema = filterSchema.extend({
  value: z.union([filterSchema.shape.value, paramRefSchema]),
})
export type RollupFilter = z.infer<typeof rollupFilterSchema>

/**
 * Over `table`'s rows whose `via` points at this row — a relation holding this row's id, or a
 * plain value equal to this row's `on` column (its first text column when unnamed) — one
 * aggregate, after `where`.
 */
export const rollupSpecSchema = z.object({
  table: identifier('table'),
  via: identifier('column'),
  on: identifier('column').optional(),
  fn: aggregateFnSchema,
  column: identifier('column').optional(),
  where: z.array(rollupFilterSchema).max(8).optional(),
})
export type RollupSpec = z.infer<typeof rollupSpecSchema>

export const querySchema = z.object({
  table: z.string().min(1),
  /** Values a rollup's `{ param }` filters read; unset drops that filter. */
  params: z.record(identifier('param'), scalarSchema).optional(),
  where: z.array(filterSchema).max(16).optional(),
  orderBy: z
    .object({ column: z.string().min(1), direction: z.enum(['asc', 'desc']).default('asc') })
    .optional(),
  limit: z.number().int().positive().max(1000).optional(),
  groupBy: z
    .object({ column: z.string().min(1), aggregates: z.array(aggregateSchema).min(1).max(8) })
    .optional(),
})
export type InkQuery = z.infer<typeof querySchema>

export const historyRangeSchema = z.enum(['7d', '14d', '30d', '90d'])
export type HistoryRange = z.infer<typeof historyRangeSchema>

/** How many rows matched `where` at the end of each day — a burn-up, a backlog over time. */
export const historyQuerySchema = z.object({
  table: z.string().min(1),
  where: z.array(filterSchema).max(16).optional(),
  range: historyRangeSchema.default('30d'),
})
export type HistoryQuery = z.infer<typeof historyQuerySchema>

export const recordDataSchema = z.record(z.string(), cellSchema)
export type RecordData = z.infer<typeof recordDataSchema>

export const mutationSchema = z.discriminatedUnion('kind', [
  z.object({ kind: z.literal('insert'), table: z.string().min(1), data: recordDataSchema }),
  z.object({
    kind: z.literal('update'),
    table: z.string().min(1),
    where: z.array(filterSchema).min(1).max(16),
    data: recordDataSchema,
  }),
  z.object({
    kind: z.literal('delete'),
    table: z.string().min(1),
    where: z.array(filterSchema).min(1).max(16),
  }),
])
export type InkMutation = z.infer<typeof mutationSchema>

export type QueryRow = Record<string, Cell>

export interface QueryResult {
  rows: QueryRow[]
  total: number
}
