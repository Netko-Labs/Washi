import type { ComponentSpec } from '@washi/wsx'
import { z } from 'zod'
import { p } from './spec-kit'
import { gapSchema, widthSchema } from './surface'

export const TILE_SHAPES = ['square', 'wide', 'tall', 'big', 'banner'] as const

/** How a page is laid out beside itself: Notion's columns, and a bento of tiles. */
export const LAYOUT_SPECS: Record<string, ComponentSpec> = {
  Columns: p({ gap: gapSchema.optional(), width: widthSchema.optional() }, 'nodes', {
    hints: { cols: 'one <Column> per column; ratio sets its share' },
  }),
  Column: p({ ratio: z.number().int().min(1).max(6).optional() }, 'nodes', {
    within: ['Columns'],
  }),
  Bento: p(
    {
      gap: gapSchema.optional(),
      width: widthSchema.optional(),
      columns: z.union([z.literal(3), z.literal(4), z.literal(6)]).optional(),
    },
    'nodes',
  ),
  Tile: p(
    { shape: z.enum(TILE_SHAPES).optional(), title: z.string().max(80).optional() },
    'nodes',
    {
      within: ['Bento'],
    },
  ),
}
