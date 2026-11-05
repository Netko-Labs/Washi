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
