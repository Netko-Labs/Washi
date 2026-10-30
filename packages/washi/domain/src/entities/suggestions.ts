import { recordDataSchema } from '@washi/ink'
import { z } from 'zod'

/** What a visitor sends through a page's link (D120); the cells are checked against the page. */
export const suggestionAskSchema = z.object({
  table: z.string().min(1).max(64),
  cells: recordDataSchema,
  name: z.string().trim().min(1).max(100),
  email: z.string().trim().max(254).pipe(z.email()),
  /** A field no person sees; anything in it is a bot's. */
  trap: z.string().max(200).optional(),
})
export type SuggestionAsk = z.infer<typeof suggestionAskSchema>

export const suggestionStatusSchema = z.enum(['pending', 'approved', 'declined'])
export type SuggestionStatus = z.infer<typeof suggestionStatusSchema>

/** A booking holds a time on a Slots or Agenda; a row is any other add. */
export const suggestionKindSchema = z.enum(['row', 'booking'])
export type SuggestionKind = z.infer<typeof suggestionKindSchema>

export const suggestionSchema = z.object({
  id: z.string(),
  sheetId: z.string(),
  sheetTitle: z.string(),
  tableName: z.string(),
  kind: suggestionKindSchema,
  /** The booking's date column, so its time reads first. */
  dateColumn: z.string().nullable(),
  cells: recordDataSchema,
  visitorName: z.string(),
  visitorEmail: z.string(),
  status: suggestionStatusSchema,
  hlcCreated: z.string(),
  isRead: z.boolean(),
})
export type Suggestion = z.infer<typeof suggestionSchema>

export const suggestionInboxSchema = z.object({
  items: z.array(suggestionSchema),
  unread: z.number().int(),
})
export type SuggestionInbox = z.infer<typeof suggestionInboxSchema>

/** The stretch of days a calendar asks about: pending times there count as taken. */
export const requestedAskSchema = z.object({
  table: z.string().min(1).max(64),
  date: z.string().min(1).max(64),
  from: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  to: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})
export type RequestedAsk = z.infer<typeof requestedAskSchema>
