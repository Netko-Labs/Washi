import type { ComponentSpec } from '@washi/wsx'
import { z } from 'zod'
import { p } from './spec-kit'

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
