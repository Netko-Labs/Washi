import type { ColumnType } from '@washi/ink'

/** How long "Added" stays beside the button after a row lands. */
export const ADDED_FOR_MS = 2400
/** How long a form behind a button, or a booked slot, says it landed. */
export const LANDED_NOTE_MS = 4000

export const REQUIRED_HINT = 'Required — fill this in'
export const NOTHING_TYPED = 'Fill in a field first'
export const EMAIL_HINT = 'An email address, like ana@example.com'
/** A visitor's suggestion is sent, not added: nothing lands until a member approves it. */
export const SENT_NOTE = 'Sent — the page’s owner will confirm it.'
export const VISITOR_FIELDS = ['name', 'email'] as const
export const EMAIL_SHAPE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/** The `<input type>` a one-line column takes; the rest are text. */
export const FORM_INPUT_TYPES: Partial<Record<ColumnType, string>> = {
  number: 'number',
  date: 'date',
  url: 'url',
}
