import type { WsxValue } from '@washi/wsx'
import type { Feel, Tone } from '../../lib/types'
import type { ThemeId } from '../../registry/themes'

export type SpecimenView = 'single' | 'matrix' | 'scratch'

export interface Specimen {
  props?: Record<string, WsxValue>
  /** WSX inside the element; omitted for a self-closing primitive. */
  children?: string
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
