import { THEME_TOKENS, toHex } from '@washi/paper/registry'
import type { Workspace } from '@washi/repository'
import { z } from 'zod'
import { setWorkspaceLook, workspaceLook } from '../themes/look'
import { defineWorkspaceTheme, WorkspaceThemeError } from '../themes/service'
import { capability } from './define'
import type { Capability, CapabilityContext } from './types'
import { THEME_DEFINE_DESCRIPTION, WORKSPACE_LOOK_SET_DESCRIPTION } from './values'

const colour = z.string().trim().min(1).max(80)
const tokens = z.object({
  bg: colour,
  card: colour,
  ink: colour,
  muted: colour,
  border: colour,
  mutedBg: colour,
  accent: colour,
  accentInk: colour,
})

/** Each token as `#RRGGBB`, read as the theme import reads CSS; a miss says which, in words. */
function hexTokens(mode: 'light' | 'dark', sent: z.output<typeof tokens>) {
  const out = {} as Record<(typeof THEME_TOKENS)[number], string>
  for (const name of THEME_TOKENS) {
    const hex = toHex(sent[name])
    if (!hex) {
      throw new WorkspaceThemeError(
        `${mode}.${name} "${sent[name]}" is not a colour — write #RRGGBB, rgb(), hsl() or oklch()`,
      )
    }
    out[name] = hex
  }
  return out
}

const NOT_A_STEWARD =
  "only a workspace owner or admin can change the workspace's default icon and cover"

/**
 * A workspace's own look from outside (D139): its page themes (`ws:<slug>`) as the Settings editor
 * makes them, and the icon and cover a page with none of its own wears.
 */
export function themeCapabilities(ws: Workspace, context: CapabilityContext): Capability[] {
  const by = {
    id: context.author,
    mayChangeAny: context.isSteward ?? context.viewer.isOwner,
  }
  return [
    capability(
      'theme_define',
      THEME_DEFINE_DESCRIPTION,
      {
        slug: z.string().trim().min(1).max(40),
        name: z.string().trim().min(1).max(40),
        light: tokens,
        dark: tokens,
      },
      false,
      ({ slug, name, light, dark }) => {
        const defined = defineWorkspaceTheme(
          ws,
          { slug, name, light: hexTokens('light', light), dark: hexTokens('dark', dark) },
          by,
        )
        return {
          key: `ws:${defined.theme.slug}`,
          name: defined.theme.name,
          created: defined.created,
          light: defined.theme.light,
          dark: defined.theme.dark,
          warnings: defined.warnings,
          wear: `<Sheet theme="ws:${defined.theme.slug}">`,
        }
      },
    ),
    capability(
      'workspace_look_set',
      WORKSPACE_LOOK_SET_DESCRIPTION,
      {
        icon: z.string().trim().min(1).max(64).nullable().optional(),
        cover: z.string().trim().min(1).max(80).nullable().optional(),
      },
      false,
      (write) => {
        if (!by.mayChangeAny) throw new WorkspaceThemeError(NOT_A_STEWARD)
        if (write.icon === undefined && write.cover === undefined) return workspaceLook(ws)
        return setWorkspaceLook(ws, write)
      },
    ),
  ]
}
