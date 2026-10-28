import type { THEME_IDS } from './surface'
import { HOUSE_THEMES } from './theme-values/house'
import { PORTED_THEMES } from './theme-values/ported'

export type ThemeId = (typeof THEME_IDS)[number]

export interface ThemeTokens {
  bg: string
  card: string
  ink: string
  muted: string
  border: string
  mutedBg: string
  accent: string
  accentInk: string
}

export interface ThemePair {
  name: string
  /** The palette a ported theme comes from. */
  credit?: string
  light: ThemeTokens
  dark: ThemeTokens
}

/** A theme is 8 tokens × 2 modes and nothing else. Fonts, radii and spacing belong to `feel`. */
export const THEMES: Record<ThemeId, ThemePair> = { ...HOUSE_THEMES, ...PORTED_THEMES }
