import { z } from 'zod'

const color = z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'a colour is #RRGGBB')

export const themeTokensSchema = z.object({
  bg: color,
  card: color,
  ink: color,
  muted: color,
  border: color,
  mutedBg: color,
  accent: color,
  accentInk: color,
})
export type ThemeTokensWrite = z.infer<typeof themeTokensSchema>

export const workspaceThemeWriteSchema = z.object({
  name: z.string().trim().min(1, 'a theme needs a name').max(40, 'a name is at most 40 characters'),
  light: themeTokensSchema,
  dark: themeTokensSchema,
})
export type WorkspaceThemeWrite = z.infer<typeof workspaceThemeWriteSchema>

/** A page wears it as `theme="ws:<slug>"`; the slug never changes, so a rename keeps every page. */
export const workspaceThemeSchema = workspaceThemeWriteSchema.extend({
  id: z.string(),
  slug: z.string(),
  createdBy: z.string(),
  hlcCreated: z.string(),
  hlcUpdated: z.string(),
})
export type WorkspaceTheme = z.infer<typeof workspaceThemeSchema>

/**
 * What a page with no `icon` or `cover` of its own wears (D139): the workspace's. Left out keeps
 * what is set; null clears it. The source stays each page's truth — nothing is written into one.
 */
export const workspaceLookWriteSchema = z.object({
  icon: z.string().trim().min(1).max(64).nullable().optional(),
  cover: z.string().trim().min(1).max(80).nullable().optional(),
})
export type WorkspaceLookWrite = z.infer<typeof workspaceLookWriteSchema>

export const workspaceLookSchema = z.object({
  icon: z.string().nullable(),
  cover: z.string().nullable(),
})
export type WorkspaceLook = z.infer<typeof workspaceLookSchema>
