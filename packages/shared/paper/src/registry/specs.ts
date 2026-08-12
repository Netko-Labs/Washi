import { querySchema, scalarSchema } from '@washi/ink'
import type { WsxRegistry } from '@washi/wsx'
import { z } from 'zod'
import { zClass } from './tw'

/** Hanko action descriptor as sheets carry it; the verb registry validates server-side. */
export const actionRefSchema = z
  .object({ verb: z.string().min(1) })
  .catchall(z.union([scalarSchema, z.array(scalarSchema)]))

const styled = z.object({ class: zClass })

export const paperRegistry: WsxRegistry = {
  Sheet: {
    props: styled
      .extend({
        title: z.string().min(1).max(200),
        icon: z.string().max(16).optional(),
        tags: z.array(z.string().min(1).max(64)).max(32).optional(),
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
