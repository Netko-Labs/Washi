import type { ColumnType } from '@washi/ink'

/** How long "Added" stays beside the button after a row lands. */
export const ADDED_FOR_MS = 2400

/** The `<input type>` a one-line column takes; the rest are text. */
export const FORM_INPUT_TYPES: Partial<Record<ColumnType, string>> = {
  number: 'number',
  date: 'date',
  url: 'url',
}
