import { filterSchema } from '@washi/ink'
import { z } from 'zod'
import { timeZoneSchema } from './agents'

const columnName = z
  .string()
  .regex(/^[a-z][a-z0-9_]*$/)
  .max(64)

export const reminderSchema = z.object({
  id: z.string(),
  title: z.string(),
  table: z.string(),
  dateColumn: z.string(),
  daysBefore: z.number().int(),
  where: z.array(filterSchema),
  /** A person column of the table: each row reminds only the member it names. */
  personColumn: z.string().nullable(),
  /** Whose wall clock says which day it is. */
  timeZone: z.string(),
  enabled: z.boolean(),
  createdBy: z.string().nullable(),
  createdAt: z.string(),
})
export type Reminder = z.infer<typeof reminderSchema>

export const reminderCreateSchema = z.object({
  title: z.string().trim().min(1).max(120),
  table: z.string().min(1).max(64),
  dateColumn: columnName,
  daysBefore: z.number().int().min(0).max(60),
  where: z.array(filterSchema).max(8).default([]),
  personColumn: columnName.nullable().default(null),
  timeZone: timeZoneSchema,
})
export type ReminderCreate = z.output<typeof reminderCreateSchema>

/** What Washi sends: the zone is the server's when it does not know the asker's. */
export const reminderAskSchema = reminderCreateSchema.extend({
  timeZone: timeZoneSchema.optional(),
})
export type ReminderAsk = z.output<typeof reminderAskSchema>

export const reminderUpdateSchema = z.object({
  id: z.string(),
  title: z.string().trim().min(1).max(120).optional(),
  daysBefore: z.number().int().min(0).max(60).optional(),
  where: z.array(filterSchema).max(8).optional(),
  personColumn: columnName.nullable().optional(),
  enabled: z.boolean().optional(),
})
export type ReminderUpdate = z.output<typeof reminderUpdateSchema>

/** One row coming due, as one person's Inbox sees it. */
export const reminderHitSchema = z.object({
  id: z.string(),
  reminderId: z.string(),
  reminderTitle: z.string(),
  recordId: z.string(),
  rowTitle: z.string(),
  /** `YYYY-MM-DD`: the row's date when it came due. */
  dueDay: z.string(),
  hlcCreated: z.string(),
  isRead: z.boolean(),
})
export type ReminderHit = z.infer<typeof reminderHitSchema>

export const reminderInboxSchema = z.object({
  items: z.array(reminderHitSchema),
  unread: z.number().int(),
})
export type ReminderInbox = z.infer<typeof reminderInboxSchema>
