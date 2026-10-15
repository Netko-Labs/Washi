import { type QueryRow, tableSpecSchema } from '@washi/ink'
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
