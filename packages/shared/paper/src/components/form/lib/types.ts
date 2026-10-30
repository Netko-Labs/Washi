import type { Cell, ColumnSpec } from '@washi/ink'
import type { AddMode, BlockProps, Visitor } from '../../../lib/types'
import type { StateRef } from '../../../registry'
import type { SheetStateValue } from '../../../state'
import type { Choice, DatabaseContext, Person } from '../../database'

export type { AddMode, Cell, Choice, ColumnSpec, DatabaseContext, Person, SheetStateValue, Visitor }

/** A literal for the new row, or page state read when it is sent — the picked month. */
export type FormDefault = Cell | StateRef

export interface FormProps extends BlockProps {
  table: string
  fields?: string[]
  defaults?: Record<string, FormDefault>
  submit?: string
  reset?: boolean
  /** Fields that must hold something before the row is sent; a required checkbox, ticked. */
  required?: string[]
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
  /** Asked as the row is sent; a reason refuses it in those words. */
  check?: () => Promise<string | null>
  onAdded?: () => void
  onCancel?: () => void
  /** A calendar's add: suggested through a link, it is a request for that time. */
  isBooking?: boolean
}

export interface FormDialogProps extends FormInlineProps {
  open: boolean
  onClose: () => void
  title: string
  seed?: Record<string, Cell>
  check?: () => Promise<string | null>
  /** Told once the row has landed, just before the dialog closes. */
  onAdded?: () => void
  isBooking?: boolean
}

export interface FormUnavailableProps {
  db: 'unreadable' | 'missing' | null
  table: string
}

/** What the form shows, what it writes (shown + defaulted), and every name it refuses, in words. */
export interface FormPlan {
  fields: ColumnSpec[]
  written: ColumnSpec[]
  required: ColumnSpec[]
  refused: string[]
}

/** What the person typed, column by column; defaults fill whatever they left alone. */
export type FormEntries = Record<string, Cell>

export type FormStatus =
  | { kind: 'idle' }
  | { kind: 'busy' }
  | { kind: 'added' }
  | { kind: 'missing'; columns: string[] }
  | { kind: 'refused'; reason: string }

export interface FormDraftOptions {
  table: string
  written: ColumnSpec[]
  required: ColumnSpec[]
  defaults?: Record<string, FormDefault>
  seed?: Record<string, Cell>
  reset: boolean
  check?: () => Promise<string | null>
  onAdded?: () => void
}

export interface FormDraft {
  values: Record<string, Cell>
  set: (column: string, value: Cell) => void
  /** `suggest` on a link that takes suggestions: the visitor says who they are. */
  mode: AddMode
  visitor: Visitor
  setVisitor: (field: keyof Visitor, value: string) => void
  status: FormStatus
  /** Resolves to the first required field left empty, if any — the one to focus. */
  submit: () => Promise<string | null>
}

export interface FormFieldProps {
  id: string
  column: ColumnSpec
  value: Cell | undefined
  people: Person[]
  onChange: (value: Cell) => void
  required?: boolean
  error?: string
}

export type FormInputProps = Omit<FormFieldProps, 'people'>

export interface FormChoiceProps extends FormInputProps {
  choices: Choice[]
}

export interface FormVisitorProps {
  id: string
  visitor: Visitor
  onChange: (field: keyof Visitor, value: string) => void
  /** Which of `name` and `email` were turned back. */
  missing: string[]
}

export interface LandedNote {
  note: string | null
  show: (words: string) => void
  clear: () => void
}

export interface FieldAria {
  'aria-required'?: true
  'aria-invalid'?: true
  'aria-describedby'?: string
}
