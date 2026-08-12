import { z } from 'zod'

export const columnTypeSchema = z.enum(['text', 'number', 'boolean', 'date', 'select'])
export type ColumnType = z.infer<typeof columnTypeSchema>

export const columnSpecSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'column names are snake_case identifiers'),
  type: columnTypeSchema,
  options: z.array(z.string().min(1)).max(64).optional(),
})
export type ColumnSpec = z.infer<typeof columnSpecSchema>

export const tableSpecSchema = z.object({
  name: z
    .string()
    .min(1)
    .max(64)
    .regex(/^[a-z][a-z0-9_]*$/, 'table names are snake_case identifiers'),
  columns: z.array(columnSpecSchema).min(1).max(64),
})
export type TableSpec = z.infer<typeof tableSpecSchema>

export const scalarSchema = z.union([z.string(), z.number(), z.boolean(), z.null()])
export type Scalar = z.infer<typeof scalarSchema>

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

export const querySchema = z.object({
  table: z.string().min(1),
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

export const recordDataSchema = z.record(z.string(), scalarSchema)
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

export type QueryRow = Record<string, Scalar>

export interface QueryResult {
  rows: QueryRow[]
  total: number
}
