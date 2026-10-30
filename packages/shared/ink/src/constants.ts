/** The most rows one copy writes: a rollover, never a bulk import. */
export const COPY_ROW_CAP = 500

/** Columns computed on every read: nothing of theirs is stored, so nothing moves. */
export const COMPUTED_COLUMN_TYPES: ReadonlySet<string> = new Set(['formula', 'rollup'])

/** Columns whose values are picked off a list of options. */
export const CHOICE_COLUMN_TYPES: ReadonlySet<string> = new Set([
  'select',
  'multi_select',
  'status',
])

export const STATUS_GROUP_KEYS = ['todo', 'doing', 'done'] as const

/** The longest text one cell holds: a note's worth, never a pasted document. */
export const MAX_TEXT_CELL = 10_000
