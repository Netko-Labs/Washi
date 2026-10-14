import type { KindOption, SaveState, TextKind } from './types'

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
