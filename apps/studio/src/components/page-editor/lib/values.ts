import type { KindOption, SaveState, StarterBlock, StarterOption, TextKind } from './types'

/** What `/database` makes: a name, and Notion's three-step status. */
export const NEW_DATABASE = (name: string) => ({
  name,
  columns: [
    { name: 'name', type: 'text' as const },
    {
      name: 'status',
      type: 'status' as const,
      groups: { todo: ['Not started'], doing: ['In progress'], done: ['Done'] },
    },
  ],
})

export const KIND_OPTIONS: KindOption[] = [
  { kind: 'text', label: 'Text', hint: 'Plain paragraph' },
  { kind: 'h1', label: 'Heading 1', hint: '#' },
  { kind: 'h2', label: 'Heading 2', hint: '##' },
  { kind: 'h3', label: 'Heading 3', hint: '###' },
  { kind: 'bullet', label: 'Bulleted list', hint: '-' },
  { kind: 'number', label: 'Numbered list', hint: '1.' },
  { kind: 'todo', label: 'To-do', hint: '[]' },
  { kind: 'quote', label: 'Quote', hint: '>' },
  { kind: 'callout', label: 'Callout', hint: '!' },
  { kind: 'code', label: 'Code', hint: '```' },
  { kind: 'divider', label: 'Divider', hint: '---' },
]

/** Typed at the start of a text block, these turn it into another kind — as in Notion. */
export const SHORTCUTS: [string, TextKind][] = [
  ['### ', 'h3'],
  ['## ', 'h2'],
  ['# ', 'h1'],
  ['- ', 'bullet'],
  ['* ', 'bullet'],
  ['1. ', 'number'],
  ['[] ', 'todo'],
  ['> ', 'quote'],
  ['! ', 'callout'],
  ['```', 'code'],
  ['---', 'divider'],
]

export const LIST_MARKERS: Partial<Record<TextKind, string>> = {
  bullet: 'bullet',
  number: 'number',
  todo: 'check',
}

export const SAVE_LABELS: Record<SaveState, string> = {
  saved: 'Saved',
  saving: 'Saving…',
  failed: "Couldn't save — keep typing to retry",
  invalid: 'Not saved — the source has errors',
}

export const HEADING_LEVELS: Partial<Record<TextKind, number>> = { h1: 1, h2: 2, h3: 3 }

export const FIELD_CLASS =
  'block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-muted-foreground/50 placeholder:opacity-0 focus:placeholder:opacity-100'

/** The paper's own type for headings; everything else reads as body text. */
export const KIND_LOOKS: Partial<Record<TextKind, string>> = {
  h1: 'wsx-title',
  h2: 'wsx-title',
  h3: 'wsx-title',
  code: 'font-mono text-[13px]',
}

export const KIND_PLACEHOLDERS: Partial<Record<TextKind, string>> = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'List',
  number: 'List',
  todo: 'To-do',
  quote: 'Quote',
  callout: 'Something to notice',
  code: 'Code',
}

/** A page made from `/`: a heading waiting for its name, like a page made in the sidebar. */
export const NEW_SUBPAGE_SOURCE = `<Sheet title="Untitled" icon="notebook" wsx="1">
  <Title></Title>
</Sheet>`

/** How many pages `/` offers to link to at once. */
export const LINK_MATCHES = 5

/** What `/` offers to upload, and the block each becomes. */
export const UPLOAD_OPTIONS = [
  { as: 'image', label: 'Image', words: 'image picture photo' },
  { as: 'video', label: 'Video', words: 'video movie clip' },
  { as: 'audio', label: 'Audio', words: 'audio sound music recording' },
  { as: 'file', label: 'File', words: 'file document pdf attachment upload' },
] as const

/** What `/widget` drops above the page: a clock in the page's own accent, reaching nothing. */
export const STARTER_WIDGET_CODE = `import { useNow } from 'washi'

function Clock() {
  const now = new Date(useNow())
  return (
    <div style={{ font: '600 40px system-ui', color: 'var(--accent)' }}>
      {now.toLocaleTimeString()}
    </div>
  )
}`
/** What `/automation` drops in over a table: a new row starts with a status. */
export const STARTER_AUTOMATION = (table: string) => `function run(event) {
  // event: { table, kind, row, before } — rows({ table }) reads, act({ verb, … }) changes rows.
  if (!event.row.status) {
    act({ verb: 'table.update', table: '${table}', row: event.row.id, set: { status: 'todo' } })
  }
}`

/** What `/formula` drops in: a function any table's formula may call as with_tax(price). */
/** `/terminal`'s first program: Node-style, so a pasted script runs as it would there. */
export const STARTER_TERMINAL = `const os = require('os')

console.log('Hello from a Washi terminal' + os.EOL)
let left = 3
const timer = setInterval(() => {
  console.log(left > 0 ? left + '…' : 'Lift off!')
  if (left-- === 0) clearInterval(timer)
}, 500)`

export const STARTER_FORMULA = `function with_tax(amount: number, rate = 0.19) {
  return Math.round(amount * (1 + rate) * 100) / 100
}`

export const STARTER_OPTIONS: StarterOption[] = [
  { block: 'steps', label: 'Steps', hint: 'how-to', words: 'steps how-to howto guide numbered' },
  {
    block: 'compare',
    label: 'Compare',
    hint: 'options',
    words: 'compare options versus pros cons',
  },
  { block: 'faq', label: 'FAQ', hint: 'questions', words: 'faq questions answers accordion' },
  { block: 'countdown', label: 'Countdown', hint: 'days left', words: 'countdown deadline until' },
]

/** The starter each drops in; a countdown is made on the day, two weeks out. */
export const STARTER_SOURCES: Record<Exclude<StarterBlock, 'countdown'>, string> = {
  steps:
    '<Steps><Step title="First step"><Text>What to do.</Text></Step><Step title="Second step"><Text>What comes next.</Text></Step><Step title="Done"><Text>How to tell it worked.</Text></Step></Steps>',
  compare:
    '<Compare><Option title="Option A"><List><Item>A strength</Item><Item>A cost</Item></List></Option><Option title="Option B" pick><List><Item>A strength</Item><Item>A cost</Item></List></Option></Compare>',
  faq: '<Faq><Question title="A question people ask"><Text>Its answer.</Text></Question><Question title="Another one"><Text>Its answer.</Text></Question></Faq>',
}

export const COUNTDOWN_DAYS = 14
