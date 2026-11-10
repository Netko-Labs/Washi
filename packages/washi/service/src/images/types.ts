import type satori from 'satori'

/** What an image is for: its size when none is given, and where it is worn. */
export type ImagePurpose = 'cover' | 'icon' | 'figure'

/** One element as Satori lays it out: a tag, its props, its children. */
export interface SatoriNode {
  type: string
  props: Record<string, unknown> & { children?: (SatoriNode | string)[] | SatoriNode | string }
}

export interface RenderRequest {
  html: string
  width: number
  height: number
}

/** A picture the markup may show: the bytes of an upload, as a `data:` address. */
export type FileInliner = (id: string) => Promise<string | null>

/** A font as Satori takes it. */
export type SatoriFont = Parameters<typeof satori>[1]['fonts'][number]

/** What drawing needs, loaded once: Satori's fonts, and the same fonts as sfnt for resvg. */
export interface Engine {
  fonts: SatoriFont[]
  fontBuffers: Uint8Array[]
}

/** Checks an address a picture names and gives back the `data:` address it draws. */
export type AddressCheck = (where: string, raw: string) => Promise<string>

export interface PictureSize {
  width: number
  height: number
}

/** A picture as an agent is shown it: its bytes at the size shown, and the size it was. */
export interface ScaledPicture extends PictureSize {
  bytes: Uint8Array
  mime: string
  original: PictureSize
}

/** An inline `<svg>` drawn ahead of layout: a PNG `data:` address and the box it takes. */
export interface SvgPicture {
  src: string
  width: number
  height: number
}
