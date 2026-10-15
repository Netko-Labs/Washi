import { z } from 'zod'

/**
 * The closed verb registry (spec §5). Every side effect a sheet or agent can
 * trigger is one of these, zod-validated, stamped through the approvals flow.
 */
const cell = z.union([
  z.string(),
  z.number(),
  z.boolean(),
  z.null(),
  z.array(z.string().min(1).max(200)).max(100),
])

const options = z.array(z.string().min(1).max(64)).max(64)

/** A property a person adds from a database's header; ink re-validates the whole spec. */
const column = z.object({
  name: z.string().min(1).max(64),
  type: z.enum([
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
  ]),
  options: options.optional(),
  groups: z.object({ todo: options, doing: options, done: options }).optional(),
  table: z.string().min(1).max(64).optional(),
})

export const VERBS = {
  'sheet.open': z.object({ verb: z.literal('sheet.open'), sheet: z.string().min(1) }),
  'sheet.create': z.object({
    verb: z.literal('sheet.create'),
    title: z.string().min(1).max(200),
  }),
  'table.insert': z.object({
    verb: z.literal('table.insert'),
    table: z.string().min(1),
    data: z.record(z.string(), cell).default({}),
  }),
  'table.update': z.object({
    verb: z.literal('table.update'),
    table: z.string().min(1),
    row: z.string().min(1),
    set: z
      .record(z.string(), cell)
      .refine((patch) => Object.keys(patch).length > 0, 'set must patch at least one column'),
  }),
  'table.reorder': z.object({
    verb: z.literal('table.reorder'),
    table: z.string().min(1),
    row: z.string().min(1),
    set: z
      .record(z.string(), cell)
      .refine((patch) => Object.keys(patch).length > 0, 'set must patch at least one column'),
  }),
  'table.delete': z.object({
    verb: z.literal('table.delete'),
    table: z.string().min(1),
    row: z.string().min(1),
  }),
  'table.column': z.object({
    verb: z.literal('table.column'),
    table: z.string().min(1),
    column,
  }),
  'url.open': z.object({ verb: z.literal('url.open'), url: z.url({ protocol: /^https$/ }) }),
} as const

export type Verb = keyof typeof VERBS

/**
 * Verbs whose effects stay inside the vault and can be undone. A user clicking
 * one in a sheet is consent; everything else leaves the machine and needs an
 * explicit stamp every time (spec Q13).
 */
const REVERSIBLE_VERBS = new Set<Verb>([
  'sheet.open',
  'sheet.create',
  'table.insert',
  'table.update',
  'table.reorder',
  'table.delete',
  'table.column',
])

export function isReversibleVerb(verb: Verb): boolean {
  return REVERSIBLE_VERBS.has(verb)
}

export type HankoAction = { [K in Verb]: z.infer<(typeof VERBS)[K]> }[Verb]

export interface HankoIssue {
  message: string
}

export type HankoResult = { ok: true; action: HankoAction } | { ok: false; issues: HankoIssue[] }

export function checkAction(input: unknown): HankoResult {
  const verb = (input as { verb?: unknown })?.verb
  if (typeof verb !== 'string' || !(verb in VERBS)) {
    return { ok: false, issues: [{ message: `unknown action verb "${String(verb)}"` }] }
  }
  const parsed = VERBS[verb as Verb].safeParse(input)
  if (!parsed.success) {
    return {
      ok: false,
      issues: parsed.error.issues.map((issue) => ({
        message: `${issue.path.join('.') || verb}: ${issue.message}`,
      })),
    }
  }
  return { ok: true, action: parsed.data }
}

/** Hosts provide one handler per verb; dispatch stays exhaustive at compile time. */
export type HankoHandlers = {
  [K in Verb]: (action: Extract<HankoAction, { verb: K }>) => Promise<void> | void
}

export async function runAction(input: unknown, handlers: HankoHandlers): Promise<void> {
  const result = checkAction(input)
  if (!result.ok) {
    throw new Error(result.issues.map((issue) => issue.message).join('; '))
  }
  switch (result.action.verb) {
    case 'sheet.open':
      return handlers['sheet.open'](result.action)
    case 'sheet.create':
      return handlers['sheet.create'](result.action)
    case 'table.insert':
      return handlers['table.insert'](result.action)
    case 'table.update':
      return handlers['table.update'](result.action)
    case 'table.reorder':
      return handlers['table.reorder'](result.action)
    case 'table.delete':
      return handlers['table.delete'](result.action)
    case 'table.column':
      return handlers['table.column'](result.action)
    case 'url.open':
      return handlers['url.open'](result.action)
    default: {
      // A verb added to VERBS without a case here would otherwise succeed and do nothing.
      const unhandled: never = result.action
      throw new Error(`no handler for "${(unhandled as { verb: string }).verb}"`)
    }
  }
}
