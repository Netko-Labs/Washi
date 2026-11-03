import type { WsxValue } from '@washi/wsx'
import type { FEELS, TONES } from '../../registry/surface'
import type { ThemeId } from '../../registry/themes'

// The registry's own words, so the book's types reach no component (the reference runs on servers).
type Feel = (typeof FEELS)[number]
type Tone = (typeof TONES)[number]

export type SpecimenView = 'single' | 'matrix' | 'scratch'

export interface Specimen {
  props?: Record<string, WsxValue>
  /** WSX inside the element; omitted for a self-closing primitive. */
  children?: string
  /** The page's code above its markup: a component the element draws (a Widget's). */
  code?: string
  /** WSX around the element, `<Here />` marking its place: a `within` parent, or a row scope. */
  wrap?: string
}

export interface SpecimenInput {
  theme: ThemeId
  feel: Feel
  accent: Exclude<Tone, 'neutral'>
  name: string
  knobs: Record<string, WsxValue>
  childrenText: string | null
}

export interface PageInput extends SpecimenInput {
  view: SpecimenView
  scratch: string | null
}

export type MatrixAxes = readonly ['variant', 'tone'] | readonly ['variant'] | null
