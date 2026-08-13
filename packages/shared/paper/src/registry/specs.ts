import { querySchema, scalarSchema } from '@washi/ink'
import type { WsxRegistry } from '@washi/wsx'
import { z } from 'zod'
import { zClass } from './tw'

/** Hanko action descriptor as sheets carry it; the verb registry validates server-side. */
export const actionRefSchema = z
  .object({ verb: z.string().min(1) })
  .catchall(z.union([scalarSchema, z.array(scalarSchema)]))

const styled = z.object({ class: zClass })

export const tapeColorSchema = z.enum([
  'pink',
  'teal',
  'blue',
  'mustard',
  'violet',
  'moss',
  'slate',
])

/** Per-sheet design direction — closed presets, no arbitrary CSS (spec Q9). */
export const sheetThemeSchema = z
  .object({
    preset: z
      .enum(['washi', 'midnight', 'broadsheet', 'sticker', 'terminal', 'blueprint'])
      .optional(),
    accent: tapeColorSchema.optional(),
    face: z.enum(['gothic', 'serif', 'rounded', 'mono']).optional(),
    paper: z.enum(['plain', 'dots', 'lines']).optional(),
  })
  .strict()

export const paperRegistry: WsxRegistry = {
  Sheet: {
    props: styled
      .extend({
        title: z.string().min(1).max(200),
        icon: z.string().max(16).optional(),
        tags: z.array(z.string().min(1).max(64)).max(32).optional(),
        theme: sheetThemeSchema.optional(),
        state: z.record(z.string().max(64), scalarSchema).optional(),
      })
      .strict(),
    children: 'nodes',
  },
  Show: {
    props: z
      .object({
        when: z.string().min(1).max(64),
        equals: scalarSchema.optional(),
        not: z.boolean().optional(),
      })
      .strict(),
    children: 'nodes',
  },
  Switch: {
    props: styled
      .extend({ state: z.string().min(1).max(64), label: z.string().max(120).optional() })
      .strict(),
    children: 'none',
  },
  Slider: {
    props: styled
      .extend({
        state: z.string().min(1).max(64),
        min: z.number().optional(),
        max: z.number().optional(),
        step: z.number().positive().optional(),
        label: z.string().max(120).optional(),
      })
      .strict(),
    children: 'none',
  },
  Tabs: {
    props: styled
      .extend({
        labels: z.array(z.string().min(1).max(60)).min(1).max(12),
        state: z.string().max(64).optional(),
      })
      .strict(),
    children: 'nodes',
  },
  Tab: { props: styled.strict(), children: 'nodes' },
  Accordion: { props: styled.strict(), children: 'nodes' },
  AccordionItem: {
    props: styled.extend({ title: z.string().min(1).max(160) }).strict(),
    children: 'nodes',
  },
  Dialog: {
    props: styled
      .extend({ trigger: z.string().min(1).max(80), title: z.string().max(160).optional() })
      .strict(),
    children: 'nodes',
  },
  Tooltip: {
    props: styled.extend({ label: z.string().min(1).max(200) }).strict(),
    children: 'nodes',
  },
  Badge: {
    props: styled
      .extend({ tone: z.enum(['default', 'outline', 'muted', 'destructive']).default('default') })
      .strict(),
    children: 'text',
  },
  Avatar: { props: styled.extend({ label: z.string().min(1).max(80) }).strict(), children: 'none' },
  Progress: {
    props: styled
      .extend({ value: z.number().min(0), max: z.number().positive().optional() })
      .strict(),
    children: 'none',
  },
  Skeleton: { props: styled.strict(), children: 'none' },
  Kbd: { props: styled.strict(), children: 'text' },
  Box: { props: styled.strict(), children: 'nodes' },
  Span: { props: styled.strict(), children: 'nodes' },
  Hero: {
    props: styled
      .extend({
        title: z.string().min(1).max(200),
        subtitle: z.string().max(500).optional(),
        align: z.enum(['left', 'center']).default('left'),
        size: z.enum(['md', 'lg']).default('md'),
      })
      .strict(),
    children: 'none',
  },
  Tape: {
    props: styled.extend({ color: tapeColorSchema.optional() }).strict(),
    children: 'text',
  },
  Stamp: {
    props: styled
      .extend({
        label: z.string().min(1).max(8),
        tone: z.enum(['accent', 'ink']).default('accent'),
      })
      .strict(),
    children: 'none',
  },
  Chip: {
    props: styled.extend({ color: tapeColorSchema.optional() }).strict(),
    children: 'text',
  },
  Stat: {
    props: styled
      .extend({
        value: z.string().min(1).max(32),
        label: z.string().min(1).max(80),
        hint: z.string().max(80).optional(),
      })
      .strict(),
    children: 'none',
  },
  Card: {
    props: styled
      .extend({ title: z.string().max(120).optional(), accent: tapeColorSchema.optional() })
      .strict(),
    children: 'nodes',
  },
  Timeline: { props: styled.strict(), children: 'nodes' },
  Step: {
    props: styled
      .extend({
        marker: z.string().min(1).max(8),
        title: z.string().max(120).optional(),
        color: tapeColorSchema.optional(),
      })
      .strict(),
    children: 'nodes',
  },
  H1: { props: styled.strict(), children: 'text' },
  H2: { props: styled.strict(), children: 'text' },
  H3: { props: styled.strict(), children: 'text' },
  P: { props: styled.strict(), children: 'nodes' },
  Quote: { props: styled.strict(), children: 'nodes' },
  Callout: {
    props: styled
      .extend({ tone: z.enum(['info', 'warning', 'success', 'danger']).default('info') })
      .strict(),
    children: 'nodes',
  },
  Code: {
    props: styled.extend({ lang: z.string().max(32).optional() }).strict(),
    children: 'text',
  },
  Divider: { props: z.object({}).strict(), children: 'none' },
  Img: {
    props: styled
      .extend({ src: z.url({ protocol: /^https$/ }), alt: z.string().max(300).optional() })
      .strict(),
    children: 'none',
  },
  Ref: { props: styled.extend({ sheet: z.string().min(1) }).strict(), children: 'text' },
  Tag: { props: styled.strict(), children: 'text' },
  TaskList: { props: styled.extend({ bind: querySchema.optional() }).strict(), children: 'nodes' },
  Task: {
    props: styled
      .extend({ done: z.boolean().default(false), record: z.string().optional() })
      .strict(),
    children: 'text',
  },
  Table: {
    props: styled
      .extend({ bind: querySchema, columns: z.array(z.string().min(1)).max(16).optional() })
      .strict(),
    children: 'none',
  },
  Board: {
    props: styled.extend({ bind: querySchema, groupBy: z.string().min(1) }).strict(),
    children: 'none',
  },
  Toggle: {
    props: styled.extend({ label: z.string().min(1).max(200) }).strict(),
    children: 'nodes',
  },
  Columns: { props: styled.strict(), children: 'nodes' },
  Column: { props: styled.strict(), children: 'nodes' },
  Button: { props: styled.extend({ action: actionRefSchema }).strict(), children: 'text' },
  Fetch: {
    props: styled
      .extend({ url: z.url({ protocol: /^https$/ }), as: z.enum(['text', 'json']).default('text') })
      .strict(),
    children: 'none',
  },
}

export type PaperComponentName = keyof typeof paperRegistry
