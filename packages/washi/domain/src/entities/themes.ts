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
