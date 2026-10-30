import type { ReactNode } from 'react'
import type { ThemePair } from '../../registry/themes'
import type { BlockProps, Feel, Tone } from './style'

export interface PaperSurfaceProps {
  children?: ReactNode
}

export interface SheetLook {
  /** A registry theme id, or `ws:<slug>` the host lends through `SheetLookHost.theme`. */
  theme?: string
  feel?: Feel
  accent?: Tone
  icon?: string
  cover?: string
}

export interface SheetFrameProps extends SheetLook {
  children?: ReactNode
}

export type LookPart = 'icon' | 'cover'

/** An Unsplash cover as the workspace keeps it: Unsplash's hotlink and whom to credit (D117). */
export interface UnsplashCredit {
  url: string
  name: string
  profileUrl: string
  pageUrl: string
}

/** What a host lends a page's look: where pictures live, how to draw an icon, how to change one. */
export interface SheetLookHost {
  /** The host's own band under the icon — who is here, the add buttons, a row's properties. */
  band?: ReactNode
  drawIcon?(name: string): ReactNode
  fileUrl?(id: string): string
  pictureUrl?(slug: string): string
  /** A photo kept for `unsplash:<id>`; unknown ids draw no picture. */
  unsplash?(id: string): UnsplashCredit | undefined
  /** A workspace theme's tokens by its `ws:<slug>` key; unknown keys wear Washi. */
  theme?(key: string): ThemePair | undefined
  /** A read-only host leaves it out and the look stays still. */
  edit?(part: LookPart, anchor: HTMLElement): void
}

export interface SheetLookProviderProps {
  value: SheetLookHost
  children?: ReactNode
}

export interface SheetCoverProps {
  cover: string
}

export interface SheetMarkProps {
  icon: string
  overCover: boolean
}

export interface RedactProps extends BlockProps {
  reason?: string
}
