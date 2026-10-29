import type { BlockProps, Gap } from './style'

export interface GalleryProps extends BlockProps {
  columns?: 2 | 3 | 4
  gap?: Gap
}

/** The picture a lightbox shows: what the grid drew, read back off it. */
export interface LightboxPicture {
  src: string
  alt: string
  caption: string
}

export interface VideoProps extends BlockProps {
  src: string
  title?: string
  poster?: string
  ratio?: '16:9' | '4:3' | '3:2' | '1:1'
}

export interface AudioProps extends BlockProps {
  src: string
  title?: string
}

export interface FileProps extends BlockProps {
  src: string
  name: string
  /** Its length; `size` is the styled enum every primitive takes. */
  bytes?: number
}

export interface BookmarkProps extends BlockProps {
  href: string
  title?: string
  description?: string
  image?: string
  site?: string
}

export interface EmbedProps extends BlockProps {
  src: string
  title?: string
  ratio?: '16:9' | '4:3' | '3:2' | '1:1'
  height?: number
}

/** Asking the workspace's list, refused by it, or playing at the frame's address. */
export type EmbedState =
  | { status: 'asking' }
  | { status: 'blocked' }
  | { status: 'playing'; player: string }
