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
  visibility: z.enum(['private', 'shared', 'public']),
  access: z.array(z.string()),
  hlcUpdated: z.string(),
})
export type SheetSummary = z.infer<typeof sheetSummarySchema>
export type SheetAuthor = SheetSummary['editedBy']

export const sheetDetailSchema = sheetSummarySchema.extend({
  source: z.string(),
  hlcCreated: z.string(),
  /** The Loro version this source is — hand it back with an edit and the edit merges. */
  version: z.string().optional(),
})
export type SheetDetail = z.infer<typeof sheetDetailSchema>

/** An emoji, a registry name, or `file:<id>` — an upload, a key never a URL (D60). */
export const sheetIconSchema = z.union([
  z.string().max(16),
  z.string().regex(/^file:[a-z0-9-]{1,48}$/),
])

export const sheetWriteSchema = z.object({
  title: z.string().min(1).max(200),
  tags: z.array(z.string().min(1).max(64)).max(32).optional(),
  source: z.string().min(1).max(512_000),
})
export type SheetWrite = z.infer<typeof sheetWriteSchema>
/** What the store keeps: the write plus the look its `<Sheet>` wears, read off the source (D64). */
export interface SheetLook {
  icon: string | null
  cover: string | null
}
/** `<Sheet>` look props to set; null drops one, undefined leaves it. */
export type SheetLookPatch = Partial<Record<'icon' | 'cover' | 'theme', string | null>>
/** Who reads a page (D65): `<Sheet visibility access>`, cached like the look. */
export interface SheetAccess {
  visibility: SheetSummary['visibility']
  access: string[]
}
export type StoredSheetWrite = SheetWrite & Partial<SheetLook> & Partial<SheetAccess>

export type AccessRow = Pick<SheetSummary, 'id' | 'parentId' | 'visibility' | 'access'>

/** Who is asking. An owner reads every page; nobody (a routine) reads only workspace pages. */
export interface Viewer {
  id: string | null
  isOwner: boolean
}

export interface SheetShare {
  token: string
  sheetId: string
  createdBy: string | null
  createdAt: string
}

/** What a person changes about a page without touching its content. */
export const sheetMetaPatchSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  icon: sheetIconSchema.nullable().optional(),
  // `preset:sage` · `picture:kiso-valley` · `file:<id>` — a key, never a URL (D60).
  cover: z
    .string()
    .regex(/^(preset|picture|file):[a-z0-9-]{1,48}$/)
    .nullable()
    .optional(),
  // A registry theme id, or `ws:<slug>` for one the workspace made; the registry has the last word.
  theme: z
    .string()
    .regex(/^(ws:)?[a-z][a-z0-9-]{0,40}$/)
    .nullable()
    .optional(),
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
