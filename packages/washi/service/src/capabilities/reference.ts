import { wsxDetails, wsxIndex } from '@washi/paper/reference'
import { COVER_PICTURES, COVER_PRESETS, SHEET_ICONS, THEME_IDS } from '@washi/paper/registry'
import { listWorkspaceThemes, type Workspace } from '@washi/repository'
import { z } from 'zod'
import { workspaceLook } from '../themes/look'
import { capability } from './define'
import type { Capability } from './types'

/** What a page may be written with and wear: read off the registry, so it never drifts from it. */
export function referenceCapabilities(ws: Workspace): Capability[] {
  return [
    capability(
      'wsx_reference',
      'How to write a page. Without primitives: every WSX primitive in one line (its props, * required, and what it holds), the look enums, and the rules for text — inline marks, escaping { } < >, written tables, links between pages. With primitives: ["Table", "Callout"]: each one’s props (type, required, allowed values), where it may sit, and an example that passes sheet_check. Read it before writing a page.',
      { primitives: z.array(z.string().min(1).max(40)).max(24).optional() },
      true,
      ({ primitives }) => (primitives?.length ? wsxDetails(primitives) : wsxIndex()),
    ),
    capability(
      'catalog_list',
      "What a <Sheet> may wear: every icon name (or one emoji, or file:<id> from an upload), every cover key (preset:<name> gradients, picture:<name> photographs, file:<id>, unsplash:<id>) and every theme, the workspace's own (ws:<slug>) included — workspaceThemes gives each one's colours (theme_define changes them) — and workspaceLook, the icon and cover a page with none of its own wears (workspace_look_set).",
      {},
      true,
      () => ({
        icons: SHEET_ICONS,
        covers: {
          presets: Object.entries(COVER_PRESETS).map(([name, { label }]) => ({
            key: `preset:${name}`,
            label,
          })),
          pictures: COVER_PICTURES.map(({ slug, label }) => ({ key: `picture:${slug}`, label })),
          uploads: 'file:<id> — an upload of a picture this workspace keeps',
        },
        themes: [...THEME_IDS, ...listWorkspaceThemes(ws).map((theme) => `ws:${theme.slug}`)],
        workspaceThemes: listWorkspaceThemes(ws).map(({ slug, name, light, dark }) => ({
          key: `ws:${slug}`,
          name,
          light,
          dark,
        })),
        workspaceLook: workspaceLook(ws),
      }),
    ),
  ]
}
