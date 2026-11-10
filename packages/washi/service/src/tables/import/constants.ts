/** Rows one import takes in all; a longer file is split by its sender. */
export const MAX_IMPORT_ROWS = 20_000

/** Characters of CSV or JSON one call may carry inline (a file has the upload caps instead). */
export const MAX_IMPORT_CHARS = 5_000_000

/** New ids said back; the rest are counted (`idsTotal`), a query finds them. */
export const IDS_SHOWN = 500

/** Refused rows said back one by one; the rest are counted. */
export const REFUSED_SHOWN = 100

/** Rows a dry run shows as they would land. */
export const SAMPLE_ROWS = 3

/** Words read as a checked box, and as an unchecked one — lowercase. */
export const TRUE_WORDS: ReadonlySet<string> = new Set([
  'true',
  'yes',
  'y',
  '1',
  'on',
  'checked',
  'x',
  '✓',
  '✔',
  '☑',
])
export const FALSE_WORDS: ReadonlySet<string> = new Set([
  'false',
  'no',
  'n',
  '0',
  'off',
  'unchecked',
  '✗',
  '✘',
  '☐',
])
