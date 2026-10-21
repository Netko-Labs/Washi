import type { WsxValue } from '@washi/wsx'
import type { Frame, View } from '../book'

export interface Specimen {
  props?: Record<string, WsxValue>
  /** WSX inside the element; omitted for a self-closing primitive. */
  children?: string
  /** WSX around the element, `<Here />` marking its place: a `within` parent, or a row scope. */
  wrap?: string
}

export interface SpecimenInput extends Pick<Frame, 'theme' | 'feel' | 'accent'> {
  name: string
  knobs: Record<string, WsxValue>
  childrenText: string | null
}

export interface PageInput extends SpecimenInput {
  view: View
  scratch: string | null
}

export type MatrixAxes = readonly ['variant', 'tone'] | readonly ['variant'] | null
