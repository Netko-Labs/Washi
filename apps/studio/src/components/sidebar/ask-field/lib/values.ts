import type { AskMood } from './types'

/** The field's border follows the face: amber while a turn runs, the signal colour when Washi asks. */
export const TINT: Record<AskMood['tint'], string> = {
  none: '',
  busy: 'border-[#e8b36a]/70',
  need: 'border-primary',
  off: 'opacity-70',
}
