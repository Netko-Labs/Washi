import type { ComponentSpec } from '@washi/wsx'
import { z } from 'zod'
import { p } from './spec-kit'

/** What a formula already means by these names; a workspace function may not take one. */
const BUILT_IN_CALLS = [
  'count',
  'sum',
  'avg',
  'min',
  'max',
  'now',
  'days',
  'month',
  'year',
  'when',
  'add_months',
]

export const SUBPAGE_LAYOUTS = ['list', 'cards', 'gallery'] as const

const pageId = z.string().min(1).max(80).describe('page id')

/** A hub page's way out — one page linked, every child of a page — and what another site shows. */
export const PAGE_SPECS: Record<string, ComponentSpec> = {
  PageLink: p({ sheet: pageId }, 'none'),
  Embed: p(
    {
      src: z.url({ protocol: /^https$/ }),
      title: z.string().min(1).max(120).optional(),
      ratio: z.enum(['16:9', '4:3', '3:2', '1:1']).optional(),
      height: z.number().int().min(80).max(900).optional(),
    },
    'none',
    { hints: { url: 'the address is src, https only' } },
  ),
  Bookmark: p(
    {
      href: z.url({ protocol: /^https$/ }),
      title: z.string().max(200).optional(),
      description: z.string().max(400).optional(),
      image: z.url({ protocol: /^https$/ }).optional(),
      site: z.string().max(80).optional(),
    },
    'none',
    { hints: { url: 'the address is href, https only' } },
  ),
  Widget: p(
    { title: z.string().max(80).optional(), height: z.number().int().min(60).max(1600).optional() },
    'text',
    {
      hints: {
        html: 'the HTML is the Widget’s children: a backtick string; it runs only where an owner allows widgets',
      },
    },
  ),
  Formula: p(
    {
      name: z
        .string()
        .regex(/^[a-z][a-z0-9_]{0,39}$/, 'a function name is lowercase letters, digits or _')
        .refine((name) => !BUILT_IN_CALLS.includes(name), 'that name is a built-in — pick another'),
      title: z.string().max(80).optional(),
    },
    'text',
    {
      hints: {
        code: 'the TS is the Formula’s children: a backtick string defining function <name>(…)',
      },
    },
  ),
  Automation: p(
    {
      table: z.string().min(1).max(64).describe('table'),
      on: z.enum(['insert', 'update']),
      title: z.string().max(80).optional(),
    },
    'text',
    {
      hints: {
        code: 'the TSX is the Automation’s children: a backtick string with a function run(event)',
      },
    },
  ),
  Include: p({ sheet: pageId }, 'none', {
    hints: { children: 'Include draws the other page itself; it takes no children' },
  }),
  Backlinks: p({ of: pageId.optional(), empty: z.string().max(160).optional() }, 'none'),
  Outline: p({ title: z.string().max(80).optional() }, 'none'),
  Subpages: p(
    {
      of: pageId.optional(),
      layout: z.enum(SUBPAGE_LAYOUTS).optional(),
      empty: z.string().max(160).optional(),
    },
    'none',
    { hints: { children: 'Subpages lists what is under the page; it takes no children' } },
  ),
}
