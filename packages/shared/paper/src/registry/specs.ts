import { querySchema, scalarSchema } from '@washi/ink'
import type { ComponentSpec, WsxRegistry } from '@washi/wsx'
import { z } from 'zod'
import {
  feelSchema,
  gapSchema,
  STYLE_PROP_HINTS,
  sizeSchema,
  styledSchema,
  themeIdSchema,
  toneSchema,
} from './surface'

/** Hanko action descriptor as sheets carry it; the verb registry validates server-side. */
export const actionRefSchema = z
  .object({ verb: z.string().min(1) })
  .catchall(z.union([scalarSchema, z.array(scalarSchema), z.record(z.string(), scalarSchema)]))

const exprSchema = z.string().min(1).max(512)
const stateKey = z.string().min(1).max(64)
const stateBag = z.record(stateKey, scalarSchema)
const columnName = z.string().min(1).max(64)
const rowRef = z.string().min(1).max(80)

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

const p = (
  shape: z.ZodRawShape,
  children: ComponentSpec['children'],
  rest?: Omit<ComponentSpec, 'props' | 'children'>,
): ComponentSpec => ({
  props: styledSchema.extend(shape).strict(),
  children,
  ...rest,
})

const frame: Record<string, ComponentSpec> = {
  Sheet: {
    props: z
      .object({
        title: z.string().min(1).max(200),
        icon: z.enum(SHEET_ICONS).optional(),
        tags: z.array(z.string().min(1).max(64)).max(32).optional(),
        feel: feelSchema.optional(),
        accent: toneSchema.exclude(['neutral']).optional(),
        theme: themeIdSchema.optional(),
        state: sheetStateSchema.optional(),
        visibility: z.enum(['private', 'shared', 'public']).optional(),
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
  Grid: p({ gap: gapSchema.optional() }, 'nodes'),
  Divider: p({}, 'none'),
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
      src: z.url({ protocol: /^https$/ }),
      alt: z.string().min(1).max(300),
      caption: z.string().max(300).optional(),
      ratio: z.enum(['16:9', '4:3', '3:2', '1:1']).optional(),
    },
    'none',
  ),
}

const dataOut: Record<string, ComponentSpec> = {
  Repeat: p(
    { bind: querySchema, as: z.string().max(32).optional(), empty: z.string().max(160).optional() },
    'nodes',
    { noNest: true },
  ),
  Table: p(
    {
      bind: querySchema,
      columns: z.array(columnName).max(16).optional(),
      empty: z.string().max(160).optional(),
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
    },
    'none',
  ),
  Chart: p(
    {
      bind: querySchema,
      kind: z.enum(['bar', 'line', 'area', 'donut']),
      label: columnName.optional(),
      value: columnName.optional(),
      empty: z.string().max(160).optional(),
    },
    'none',
  ),
  Timeline: p({}, 'nodes'),
  Step: p({ marker: z.string().min(1).max(8), title: z.string().max(120).optional() }, 'nodes', {
    within: ['Timeline'],
  }),
  Progress: p(
    {
      value: z.number().min(0).max(1).optional(),
      expr: exprSchema.optional(),
      label: z.string().max(80).optional(),
    },
    'none',
  ),
  Badge: p({ expr: exprSchema.optional() }, 'text'),
  Avatar: p({ label: z.string().min(1).max(80) }, 'none'),
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
      bind: querySchema,
      groupBy: columnName,
      groups: z.array(z.string().min(1).max(40)).min(1).max(12).optional(),
      rank: columnName.optional(),
      title: columnName.optional(),
      badge: columnName.optional(),
      meta: columnName.optional(),
      avatar: columnName.optional(),
      onAdd: actionRefSchema.optional(),
      empty: z.string().max(160).optional(),
    },
    'none',
    { hints: { onMove: 'drag writes table.reorder on its own — set rank and groupBy' } },
  ),
  Button: p({ action: actionRefSchema }, 'text'),
  Task: p({ row: rowRef.optional(), done: z.boolean().optional() }, 'text'),
  Switch: p({ state: stateKey, label: z.string().max(120).optional() }, 'none'),
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
}

const kit: Record<string, ComponentSpec> = {
  Tape: p({}, 'text'),
  Stamp: p({ label: z.string().min(1).max(8) }, 'none'),
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
  components: { ...frame, ...text, ...surface, ...dataOut, ...dataIn, ...flow, ...kit },
  hints: STYLE_PROP_HINTS,
  budget: { nodes: 400, binds: 8, exprs: 24 },
}

export const PRIMITIVE_GROUPS = {
  frame: Object.keys(frame),
  text: Object.keys(text),
  surface: Object.keys(surface),
  dataOut: Object.keys(dataOut),
  dataIn: Object.keys(dataIn),
  flow: Object.keys(flow),
  kit: Object.keys(kit),
} as const

export type PaperComponentName = keyof typeof paperRegistry.components
