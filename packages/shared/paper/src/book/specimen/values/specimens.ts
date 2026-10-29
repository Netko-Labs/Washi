import type { Specimen } from '../types'
import { DATA_SPECIMENS } from './data'
import { INPUT_SPECIMENS } from './input'
import { LAYOUT_SPECIMENS } from './layout'
import { TEXT_SPECIMENS } from './text'

/** One default for every primitive but Sheet. Knobs override props; wraps satisfy `within`. */
export const SPECIMENS: Record<string, Specimen> = {
  ...LAYOUT_SPECIMENS,
  ...TEXT_SPECIMENS,
  ...DATA_SPECIMENS,
  ...INPUT_SPECIMENS,
}
