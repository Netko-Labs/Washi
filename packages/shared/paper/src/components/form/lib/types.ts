import type { Cell, ColumnSpec } from '@washi/ink'
import type { BlockProps } from '../../../lib/types'
import type { StateRef } from '../../../registry'
import type { SheetStateValue } from '../../../state'
import type { Choice, DatabaseContext, Person } from '../../database'

export type { Cell, Choice, ColumnSpec, DatabaseContext, Person, SheetStateValue }

/** A literal for the new row, or page state read when it is sent — the picked month. */
export type FormDefault = Cell | StateRef

export interface FormProps extends BlockProps {
  table: string
  fields?: string[]
  defaults?: Record<string, FormDefault>
  submit?: string
  reset?: boolean
  /** A button with this label opens the form in a modal instead of laying it on the page. */
  trigger?: string
  /** The modal's heading; the trigger's words when left out. */
  title?: string
}

export type FormInlineProps = Omit<FormProps, 'trigger' | 'title'>

export interface FormBodyProps extends Omit<FormInlineProps, 'table'> {
  db: DatabaseContext
  /** Values the opener already knows — the day a calendar's + was pressed on. */
  seed?: Record<string, Cell>
  onAdded?: () => void
  onCancel?: () => void
}

export interface FormDialogProps extends FormInlineProps {
  open: boolean
  onClose: () => void
  title: string
  seed?: Record<string, Cell>
}

export interface FormUnavailableProps {
  db: 'unreadable' | 'missing' | null
  table: string
}

/** What the form shows, what it writes (shown + defaulted), and every name it refuses, in words. */
export interface FormPlan {
  fields: ColumnSpec[]
  written: ColumnSpec[]
  refused: string[]
}

/** What the person typed, column by column; defaults fill whatever they left alone. */
export type FormEntries = Record<string, Cell>

export type FormStatus =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'added' }
  | { kind: 'refused'; reason: string }

export interface FormDraftOptions {
  table: string
  written: ColumnSpec[]
  defaults?: Record<string, FormDefault>
  seed?: Record<string, Cell>
  reset: boolean
  onAdded?: () => void
}

export interface FormDraft {
  values: Record<string, Cell>
  set: (column: string, value: Cell) => void
  status: FormStatus
  canSubmit: boolean
  submit: () => Promise<void>
}

export interface FormFieldProps {
  id: string
  column: ColumnSpec
  value: Cell | undefined
  people: Person[]
  onChange: (value: Cell) => void
}

export type FormInputProps = Omit<FormFieldProps, 'people'>

export interface FormChoiceProps extends FormInputProps {
  choices: Choice[]
}
