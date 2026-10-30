/** The most rows one copy writes: a rollover, never a bulk import. */
export const COPY_ROW_CAP = 500

/** The longest text one cell holds: a note's worth, never a pasted document. */
export const MAX_TEXT_CELL = 10_000
