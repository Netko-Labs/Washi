import { z } from 'zod'

export const sheetSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().nullable(),
  tags: z.array(z.string()),
  hlcUpdated: z.string(),
})
export type SheetSummary = z.infer<typeof sheetSummarySchema>

export const sheetDetailSchema = sheetSummarySchema.extend({
  source: z.string(),
  hlcCreated: z.string(),
})
export type SheetDetail = z.infer<typeof sheetDetailSchema>

export const sheetWriteSchema = z.object({
  title: z.string().min(1).max(200),
  icon: z.string().max(16).nullable().optional(),
  tags: z.array(z.string().min(1).max(64)).max(32).optional(),
  source: z.string().min(1).max(512_000),
})
export type SheetWrite = z.infer<typeof sheetWriteSchema>

export interface SearchHit {
  id: string
  title: string
  icon: string | null
  snippet: string
}
