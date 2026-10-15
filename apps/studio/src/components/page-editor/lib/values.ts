import type { KindOption, SaveState, TextKind } from './types'

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
