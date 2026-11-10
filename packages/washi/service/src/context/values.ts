/** What a digest weighs unless the caller says: enough for a project, small enough to keep. */
export const DEFAULT_MAX_CHARS = 15_000
export const MIN_MAX_CHARS = 2_000
export const MAX_MAX_CHARS = 200_000

/** How much of the agent guide the MCP instructions carry. */
export const GUIDE_MAX_CHARS = 6_000

/** App meta: the page a workspace keeps for outside agents to read first. */
export const AGENT_GUIDE_KEY = 'agent_guide'

/** A table this small is listed whole; a larger one only by its open rows. */
export const WHOLE_TABLE_ROWS = 12
/** Rows an expr reads per table (the query's own cap). */
export const ROWS_READ = 1_000
/** Open rows read per table: more than any budget shows; the total comes off the counts. */
export const OPEN_ROWS_READ = 300
/** A cell longer than this is cut in a row line. */
export const CELL_CHARS = 64
/** A row's title is how it is known: cut only when very long. */
export const TITLE_CHARS = 120
/** A written table's cell is the page's own words: cut only when very long. */
export const WRITTEN_CELL_CHARS = 240
/** The most of the budget each part may take; the pages share whatever the rest leave. */
export const SHARES = { guide: 0.3, tree: 0.12, tables: 0.2, rows: 0.35, leftOut: 0.06 } as const
/** Least words a page keeps (all of a shorter one) before the rest of the tree is only counted. */
export const LEAST_PAGE = 300
/** Least room a table's rows need to be shown at all; past it, they are only named. */
export const LEAST_ROWS = 400
/** What closes a page cut short; its heading carries the id to read the rest. */
export const CUT_STUB = ' …\n\n*(cut — sheet_get for the rest)*'
/** What closes a digest that still ran long: never more than maxChars. */
export const HARD_CUT =
  '\n\n*Cut at maxChars — ask with a larger maxChars, a root or fewer tables.*'

/** Words drawn inline inside a paragraph rather than as blocks of their own. */
export const INLINE = new Set(['Mark', 'Kbd', 'Ref', 'Tag', 'Badge', 'Chip', 'Money', 'Avatar'])

/** Elements that only arrange what they hold: their children are read in order. */
export const LAYOUT = new Set([
  'Row',
  'Stack',
  'Grid',
  'Columns',
  'Column',
  'Bento',
  'Gallery',
  'Redact',
  'Show',
  'Note',
  'Source',
  'Steps',
  'Timeline',
  'Faq',
  'Compare',
])

/** Elements that draw nothing a reader needs in words. */
export const SILENT = new Set([
  'Mascot',
  'Divider',
  'Outline',
  'Switch',
  'Select',
  'Slider',
  'Edge',
  'Schema',
  'Field',
])

/** Elements whose rows come from a table: one line each, never their data. */
export const DATA_BOUND = new Set([
  'Board',
  'Database',
  'Roadmap',
  'Agenda',
  'Slots',
  'Chart',
  'Heatmap',
  'Repeat',
  'Drawer',
  'Form',
  'Compose',
  'Task',
])

/** Column types a row line keeps besides the title: what the work is sorted and read by. */
export const KEY_TYPES = new Set([
  'status',
  'select',
  'multi_select',
  'date',
  'person',
  'number',
  'boolean',
])
