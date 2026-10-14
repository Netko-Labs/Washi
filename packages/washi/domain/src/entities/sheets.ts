import { z } from 'zod'

export const sheetSummarySchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().nullable(),
  tags: z.array(z.string()),
  parentId: z.string().nullable(),
  position: z.string(),
  cover: z.string().nullable(),
  fullWidth: z.boolean(),
  editedBy: z.enum(['washi']).nullable(),
  /** Washi's last write can be taken back: nobody has written the page since. */
  undoable: z.boolean(),
  rowOf: z.string().nullable(),
  hlcUpdated: z.string(),
})
export type SheetSummary = z.infer<typeof sheetSummarySchema>
export type SheetAuthor = SheetSummary['editedBy']

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

/** What a person changes about a page without touching its content. */
export const sheetMetaPatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: z.string().max(16).nullable().optional(),
  cover: z.string().max(32).nullable().optional(),
  fullWidth: z.boolean().optional(),
})
export type SheetMetaPatch = z.infer<typeof sheetMetaPatchSchema>

export const trashEntrySchema = z.object({
  id: z.string(),
  title: z.string(),
  icon: z.string().nullable(),
  deletedAt: z.string(),
  nestedCount: z.number().int(),
})
export type TrashEntry = z.infer<typeof trashEntrySchema>

export interface SearchHit {
  id: string
  title: string
  icon: string | null
  snippet: string
}
