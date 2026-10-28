import type { ComponentSpec } from '@washi/wsx'
import { z } from 'zod'
import { p } from './spec-kit'

export const SUBPAGE_LAYOUTS = ['list', 'cards', 'gallery'] as const

const pageId = z.string().min(1).max(80).describe('page id')

/** A hub page's way out: one page linked as a block, or every child of a page, live. */
export const PAGE_SPECS: Record<string, ComponentSpec> = {
  PageLink: p({ sheet: pageId }, 'none'),
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
