import type { ClockChoice, When } from '../../../lib/types'

export type { ClockChoice, When }

/** `field` sits in a form like any input; `cell` sits in a table cell or a property row. */
export type WhenLook = 'field' | 'cell'

export interface WhenInputProps {
  /** The column (or the event) it edits, read out to assistive tech. */
  label: string
  value: When
  onChange: (value: When) => void
  look?: WhenLook
  /** The id the form's label points at: the day input's. */
  id?: string
  autoFocus?: boolean
  locale?: string
  /** Times only — a calendar whose day is fixed elsewhere draws no day input. */
  hasDay?: boolean
  /** False: the day alone (and an end day), its hours kept in columns of their own. */
  hasHours?: boolean
}

export interface ClockSelectProps {
  label: string
  value: string
  choices: ClockChoice[]
  className: string
  onChange: (time: string) => void
}
