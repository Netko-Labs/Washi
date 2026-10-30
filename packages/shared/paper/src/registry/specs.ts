// conventions: >300 lines — one registry table, grouped by primitive family; split by family when next touched
import { cellSchema, filterSchema, historyQuerySchema, querySchema, scalarSchema } from '@washi/ink'
import type { ComponentSpec, WsxRegistry } from '@washi/wsx'
import { z } from 'zod'
import { EXPLAIN_SPECS, STEPS_STEP_PROPS } from './explain-specs'
import { LAYOUT_SPECS } from './layout-specs'
import { coverKeySchema, pageIconSchema } from './looks'
import { MEDIA_SPECS, mediaSrcSchema } from './media-specs'
import { PAGE_SPECS } from './page-specs'
import { p } from './spec-kit'
import {
  feelSchema,
  gapSchema,
  STYLE_PROP_HINTS,
  sheetThemeSchema,
  sizeSchema,
  styledSchema,
  toneSchema,
  widthSchema,
} from './surface'

const actionLeaf = z.union([scalarSchema, z.array(scalarSchema)])
const actionEntry = z.union([actionLeaf, z.record(z.string(), actionLeaf)])
const actionRecord = z.record(z.string(), actionEntry)

/**
 * Hanko action descriptor as sheets carry it; the verb registry validates server-side. Two levels
 * deep, for `table.copy`'s filters (`value: { param }`) and `set` (`{ expr }`).
 */
export const actionRefSchema = z
  .object({ verb: z.string().min(1) })
  .catchall(z.union([actionEntry, z.array(z.union([scalarSchema, actionRecord])), actionRecord]))

const exprSchema = z.string().min(1).max(512)
const stateKey = z.string().min(1).max(64).describe('state key')
const stateBag = z.record(stateKey, scalarSchema)

/**
 * A data view's filter may read page state — `{ state: 'month' }` — so one set of views follows a
 * picker (D72). The page resolves it before the query leaves; unset state drops the filter.
 */
export const stateRefSchema = z.object({ state: stateKey }).strict()
export const bindFilterSchema = filterSchema.extend({
  value: z.union([filterSchema.shape.value, stateRefSchema]),
})
const bindWhere = z.array(bindFilterSchema).max(16).optional()
/** A query's `params` feed its table's rollups; each may read state too (D74). */
const bindParams = z.record(stateKey, z.union([scalarSchema, stateRefSchema])).optional()
export const bindQuerySchema = querySchema.extend({ where: bindWhere, params: bindParams })
export const bindHistorySchema = historyQuerySchema.extend({ where: bindWhere })
export type StateRef = z.infer<typeof stateRefSchema>
export type BindFilter = z.infer<typeof bindFilterSchema>
export type BindQuery = z.infer<typeof bindQuerySchema>
export type BindHistoryQuery = z.infer<typeof bindHistorySchema>
const columnName = z.string().min(1).max(64).describe('column')
const rowRef = z.string().min(1).max(80)
const memberId = z.string().min(1).max(80)
/** Columns hidden from a shared link (D65); one view's redact hides them from the whole page. */
const redact = z.array(columnName).min(1).max(32).optional()
const width = widthSchema.optional()

export const SHEET_ICONS = [
  'notebook',
  'book',
  'bookmark',
  'calendar',
  'chart',
  'checklist',
  'clock',
  'compass',
  'flag',
  'flask',
  'heart',
  'home',
  'inbox',
  'kanban',
  'leaf',
  'map',
  'money',
  'music',
  'pen',
  'plane',
  'rocket',
  'sparkles',
  'star',
  'sun',
  'tag',
  'target',
  'tools',
  'user',
] as const

export const sheetStateSchema = z
  .object({ local: stateBag.optional(), stored: stateBag.optional() })
  .strict()

const frame: Record<string, ComponentSpec> = {
  Sheet: {
    props: z
      .object({
        title: z.string().min(1).max(200),
        icon: z.union([z.enum(SHEET_ICONS), pageIconSchema]).optional(),
        cover: coverKeySchema.optional(),
        tags: z.array(z.string().min(1).max(64)).max(32).optional(),
        feel: feelSchema.optional(),
        accent: toneSchema.exclude(['neutral']).optional(),
        theme: sheetThemeSchema.optional(),
        state: sheetStateSchema.optional(),
        visibility: z.enum(['private', 'shared', 'public']).optional(),
        access: z.array(memberId).max(64).optional(),
        suggest: z.boolean().optional(),
        wsx: z.literal('1').optional(),
      })
      .strict(),
    children: 'nodes',
    hints: {
      class: 'the Sheet owns measure and padding — pick a feel',
      mood: 'light/dark is the reader’s — never pinned by a page',
      preset: 'use theme',
    },
  },
  Section: p({ title: z.string().max(120).optional(), gap: gapSchema.optional() }, 'nodes'),
  Row: p(
    {
      gap: gapSchema.optional(),
      align: z.enum(['start', 'center', 'end', 'baseline', 'stretch']).optional(),
    },
    'nodes',
  ),
  Stack: p(
    { gap: gapSchema.optional(), align: z.enum(['start', 'center', 'end', 'stretch']).optional() },
    'nodes',
  ),
  Grid: p({ gap: gapSchema.optional(), width }, 'nodes'),
  Divider: p({}, 'none'),
  ...LAYOUT_SPECS,
}

const text: Record<string, ComponentSpec> = {
  Title: p({ level: z.union([z.literal(1), z.literal(2), z.literal(3)]).optional() }, 'nodes'),
  Text: p({ lead: z.boolean().optional() }, 'nodes'),
  List: p({ marker: z.enum(['bullet', 'number', 'check']).optional() }, 'nodes'),
  Item: p({ done: z.boolean().optional() }, 'nodes', { within: ['List'] }),
  Quote: p({}, 'nodes'),
  Code: p({ lang: z.string().max(32).optional() }, 'text'),
  Pair: p({ term: z.string().min(1).max(120) }, 'nodes'),
  Note: p({}, 'nodes'),
  Source: p({}, 'nodes'),
  Money: p(
    {
      value: z.number().optional(),
      expr: exprSchema.optional(),
      currency: z.string().regex(/^[A-Z]{3}$/),
    },
    'none',
  ),
  Mark: p({}, 'text'),
  Kbd: p({}, 'text'),
  Ref: p({ sheet: z.string().min(1) }, 'text'),
  Tag: p({}, 'text'),
}

const surface: Record<string, ComponentSpec> = {
  Card: p({ title: z.string().max(120).optional() }, 'nodes'),
  Callout: p({ title: z.string().max(120).optional() }, 'nodes'),
  Redact: p({ reason: z.string().max(80).optional() }, 'nodes', {
    hints: { hide: 'wrap what a shared link must not show; members still see it' },
  }),
  Hero: p(
    {
      title: z.string().min(1).max(200),
      subtitle: z.string().max(500).optional(),
      align: z.enum(['left', 'center']).optional(),
    },
    'none',
  ),
  Figure: p(
    {
      src: mediaSrcSchema,
      alt: z.string().min(1).max(300),
      caption: z.string().max(300).optional(),
      ratio: z.enum(['16:9', '4:3', '3:2', '1:1']).optional(),
    },
    'none',
  ),
}

const CHART_SHAPE = {
  width,
  bind: bindQuerySchema.optional(),
  history: bindHistorySchema.optional(),
  kind: z.enum(['bar', 'line', 'area', 'donut']),
  label: columnName.optional(),
  value: columnName.optional(),
  empty: z.string().max(160).optional(),
  redact,
}

const dataOut: Record<string, ComponentSpec> = {
  Repeat: p(
    {
      bind: bindQuerySchema,
      as: z.string().max(32).optional(),
      empty: z.string().max(160).optional(),
      redact,
    },
    'nodes',
    { noNest: true },
  ),
  /**
   * A week (or `view="month"`, a month grid) of rows on their `date`, ‹ › to move, today marked;
   * a row opens where the reader is. `state` names a `YYYY-MM` key a month follows and writes.
   * `add` names the fields of each day's + — a modal Form with that day already in `date`.
   */
  Agenda: p(
    {
      bind: bindQuerySchema,
      width,
      date: columnName,
      title: columnName.optional(),
      time: columnName.optional(),
      end: columnName.optional(),
      badge: columnName.optional(),
      add: z.array(columnName).min(1).max(16).optional(),
      addLabel: z.string().min(1).max(40).optional(),
      empty: z.string().max(60).optional(),
      weekStart: z.enum(['monday', 'sunday']).optional(),
      view: z.enum(['week', 'month']).optional(),
      state: stateKey.optional(),
      redact,
    },
    'none',
  ),
  /**
   * Free times to book (D102): each allowed day's `hours` cut into `minutes`-long slots, minus
   * the rows in `bind` whose `date` (`start/end`) overlaps and minus what is past. A press opens a
   * modal Form of `add` with the slot already in `date`.
   */
  Slots: p(
    {
      bind: bindQuerySchema,
      date: columnName,
      minutes: z.number().int().min(5).max(480).optional(),
      hours: z
        .string()
        .regex(/^([01]\d|2[0-3]):[0-5]\d-([01]\d|2[0-3]):[0-5]\d$/, 'hours read like 09:00-17:00')
        .refine((hours) => {
          const [open = '', close = ''] = hours.split('-')
          return open < close
        }, 'hours open before they close: 09:00-17:00')
        .optional(),
      days: z
        .array(z.enum(['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']))
        .min(1)
        .max(7)
        .optional(),
      add: z.array(columnName).min(1).max(16).optional(),
      addLabel: z.string().min(1).max(40).optional(),
      empty: z.string().max(80).optional(),
      weekStart: z.enum(['monday', 'sunday']).optional(),
    },
    'none',
  ),
  Table: p(
    {
      bind: bindQuerySchema,
      width,
      columns: z.array(columnName).max(16).optional(),
      empty: z.string().max(160).optional(),
      redact,
    },
    'none',
  ),
  Stat: p(
    {
      value: z.union([z.string().max(32), z.number()]).optional(),
      expr: exprSchema.optional(),
      label: z.string().min(1).max(80),
      hint: z.string().max(80).optional(),
      trend: z.enum(['up', 'down', 'flat']).optional(),
      format: z.enum(['number', 'percent']).optional(),
      currency: z
        .string()
        .regex(/^[A-Z]{3}$/, 'is a three-letter currency code, like USD or EUR')
        .optional(),
    },
    'none',
  ),
  Chart: {
    props: styledSchema
      .extend(CHART_SHAPE)
      .strict()
      .refine((props) => Boolean(props.bind) !== Boolean(props.history), {
        message: 'a Chart takes bind (now) or history (over time), exactly one',
      }),
    children: 'none',
  },
  Timeline: p({}, 'nodes'),
  Canvas: p({ width }, 'nodes', {
    hints: {
      nodes: 'children are <Node id x y tone? page?>label</Node> and <Edge from to label? />',
    },
  }),
  Node: p(
    {
      id: z.string().regex(/^[a-z0-9][a-z0-9_-]{0,63}$/, 'node ids are short lowercase slugs'),
      x: z.number(),
      y: z.number(),
      page: z.string().min(1).max(80).optional(),
    },
    'text',
    { within: ['Canvas'] },
  ),
  Edge: p(
    {
      from: z.string().min(1).max(64),
      to: z.string().min(1).max(64),
      label: z.string().max(60).optional(),
    },
    'none',
    { within: ['Canvas'] },
  ),
  Roadmap: p(
    {
      bind: bindQuerySchema,
      width,
      date: columnName,
      end: columnName.optional(),
      title: columnName.optional(),
      empty: z.string().max(160).optional(),
      redact,
    },
    'none',
    {
      hints: {
        start:
          'date names the start: date="start", with end="due" or start/end values in one column',
      },
    },
  ),
  /** A Timeline's step names its marker; a step of Steps is numbered and must say what it is. */
  Step: p({ marker: z.string().min(1).max(8), title: z.string().max(120).optional() }, 'nodes', {
    within: ['Timeline', 'Steps'],
    propsWithin: { Steps: STEPS_STEP_PROPS },
  }),
  /**
   * Days as a grid (D103), GitHub's contribution calendar: the last `weeks` weeks to today, each
   * day as dark as its rows — counted, or `value` summed — in five steps of the accent.
   */
  Heatmap: p(
    {
      bind: bindQuerySchema,
      date: columnName,
      value: columnName.optional(),
      weeks: z.number().int().min(4).max(53).optional(),
      label: z.string().max(60).optional(),
      weekStart: z.enum(['monday', 'sunday']).optional(),
      redact,
    },
    'none',
  ),
  Progress: p(
    {
      // Inside a Repeat, `value="$row.done"` reads each row's own ratio.
      value: z
        .union([
          z.number().min(0).max(1),
          z.string().regex(/^\$row\.[a-z_][a-z0-9_]*$/i, 'a ratio 0–1, or $row.column in a Repeat'),
        ])
        .optional(),
      expr: exprSchema.optional(),
      label: z.string().max(80).optional(),
    },
    'none',
  ),
  Badge: p({ expr: exprSchema.optional() }, 'text'),
  Avatar: p({ label: z.string().min(1).max(80) }, 'none'),
  Schema: p({ table: z.string().min(1).max(64) }, 'none'),
}

const dataIn: Record<string, ComponentSpec> = {
  Field: p(
    {
      field: columnName,
      kind: z.enum(['text', 'number', 'date', 'select', 'boolean']),
      label: z.string().max(120).optional(),
      help: z.string().max(200).optional(),
      table: z.string().min(1).max(64).optional(),
      row: rowRef.optional(),
    },
    'none',
  ),
  Board: p(
    {
      bind: bindQuerySchema,
      width,
      groupBy: columnName,
      groups: z.array(z.string().min(1).max(40)).min(1).max(12).optional(),
      rank: columnName.optional(),
      title: columnName.optional(),
      kicker: columnName.optional(),
      badge: columnName.optional(),
      meta: columnName.optional(),
      avatar: columnName.optional(),
      onAdd: actionRefSchema.optional(),
      onOpen: actionRefSchema.optional(),
      empty: z.string().max(160).optional(),
      redact,
    },
    'none',
    { hints: { onMove: 'drag writes table.reorder on its own — set rank and groupBy' } },
  ),
  Database: p(
    {
      table: z.string().min(1).max(64),
      width,
      views: z
        .array(
          z
            .object({
              name: z.string().min(1).max(40),
              kind: z.enum(['table', 'board', 'timeline', 'gallery']),
              groupBy: columnName.optional(),
              cover: columnName.optional(),
              date: columnName.optional(),
              where: bindWhere,
              columns: z.array(columnName).max(16).optional(),
            })
            .strict(),
        )
        .min(1)
        .max(8)
        .optional(),
      empty: z.string().max(160).optional(),
      redact,
    },
    'none',
    {
      hints: {
        views:
          'tabs; omit for a table, plus a board grouped by the first status/select column; a gallery takes cover (a url or cover-key column)',
      },
    },
  ),
  Button: p({ action: actionRefSchema }, 'text'),
  Compose: p(
    {
      action: actionRefSchema,
      label: z.string().max(40).optional(),
      placeholder: z.string().max(120).optional(),
      multiline: z.boolean().optional(),
    },
    'none',
  ),
  /**
   * One whole row typed and inserted with `table.insert` (D75). The registry can't see columns:
   * a field that is computed or unknown is refused when the form renders, and by the write.
   */
  Form: p(
    {
      table: z.string().min(1).max(64),
      fields: z
        .array(columnName)
        .min(1)
        .max(32)
        .refine((names) => new Set(names).size === names.length, 'a field is named twice')
        .optional(),
      defaults: z.record(columnName, z.union([cellSchema, stateRefSchema])).optional(),
      submit: z.string().min(1).max(40).optional(),
      reset: z.boolean().optional(),
      /** Fields that must be filled before the row is sent; each is one the form shows. */
      required: z.array(columnName).min(1).max(32).optional(),
      /** A button with these words opens the form in a modal instead of laying it on the page. */
      trigger: z.string().min(1).max(40).optional(),
      title: z.string().min(1).max(80).optional(),
    },
    'none',
  ),
  /** `field` is the checkbox column it ticks (default `done`): a "paid" box is `field="paid"`. */
  Task: p(
    { row: rowRef.optional(), done: z.boolean().optional(), field: columnName.optional() },
    'text',
  ),
  Switch: p({ state: stateKey, label: z.string().max(120).optional() }, 'none'),
  /** Picks one value into state — a month for every view filtered on it. `all` is "no filter". */
  Select: p(
    {
      state: stateKey,
      label: z.string().max(120).optional(),
      options: z
        .array(
          z.union([
            z.string().min(1).max(80),
            z
              .object({ value: z.string().min(1).max(80), label: z.string().min(1).max(80) })
              .strict(),
          ]),
        )
        .min(1)
        .max(60),
      all: z.string().min(1).max(60).optional(),
    },
    'none',
  ),
  Slider: p(
    {
      state: stateKey,
      min: z.number().optional(),
      max: z.number().optional(),
      step: z.number().positive().optional(),
      label: z.string().max(120).optional(),
    },
    'none',
  ),
}

const flow: Record<string, ComponentSpec> = {
  Show: {
    props: z.object({ expr: exprSchema }).strict(),
    children: 'nodes',
    hints: { when: 'use expr', equals: 'use expr', not: 'use expr' },
  },
  Tabs: p(
    { labels: z.array(z.string().min(1).max(60)).min(1).max(12), state: stateKey.optional() },
    'nodes',
  ),
  Tab: p({}, 'nodes', { within: ['Tabs'] }),
  Reveal: p({ label: z.string().min(1).max(120), state: stateKey.optional() }, 'nodes'),
  Drawer: p(
    {
      state: stateKey,
      bind: bindQuerySchema.optional(),
      title: z.string().max(120).optional(),
      redact,
    },
    'nodes',
    { noNest: true },
  ),
}

const kit: Record<string, ComponentSpec> = {
  Chip: p({}, 'text'),
  Mascot: p(
    {
      mood: z.enum(['happy', 'sleep', 'curious', 'sad', 'dizzy', 'wink']).optional(),
      size: sizeSchema.optional(),
    },
    'none',
    { unique: true },
  ),
  Missing: {
    props: z
      .object({ kind: z.string().min(1).max(40), reason: z.string().min(1).max(200) })
      .strict(),
    children: 'none',
  },
}

export const paperRegistry: WsxRegistry = {
  components: {
    ...frame,
    ...text,
    ...surface,
    ...PAGE_SPECS,
    ...MEDIA_SPECS,
    ...EXPLAIN_SPECS,
    ...dataOut,
    ...dataIn,
    ...flow,
    ...kit,
  },
  hints: STYLE_PROP_HINTS,
  budget: { nodes: 400, binds: 8, exprs: 24 },
}

export const PRIMITIVE_GROUPS = {
  frame: Object.keys(frame),
  text: Object.keys(text),
  surface: Object.keys(surface),
  pages: Object.keys(PAGE_SPECS),
  media: Object.keys(MEDIA_SPECS),
  explain: Object.keys(EXPLAIN_SPECS),
  dataOut: Object.keys(dataOut),
  dataIn: Object.keys(dataIn),
  flow: Object.keys(flow),
  kit: Object.keys(kit),
} as const

export type PaperComponentName = keyof typeof paperRegistry.components
