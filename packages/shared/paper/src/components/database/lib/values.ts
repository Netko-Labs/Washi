import type { NumberFormatChoice, PropertyType, StatusGroup } from './types'

export const PROPERTY_TYPES: PropertyType[] = [
  { type: 'text', label: 'Text', hint: 'Words, a name, a note' },
  { type: 'number', label: 'Number', hint: 'Amounts, counts, scores' },
  { type: 'status', label: 'Status', hint: 'Not started · In progress · Done' },
  { type: 'select', label: 'Select', hint: 'One choice from a list' },
  { type: 'multi_select', label: 'Multi-select', hint: 'Several choices from a list' },
  { type: 'date', label: 'Date', hint: 'A day, or a range' },
  { type: 'person', label: 'Person', hint: 'Someone in the workspace' },
  { type: 'boolean', label: 'Checkbox', hint: 'Yes or no' },
  { type: 'url', label: 'URL', hint: 'A link' },
]

/** The formats a new number offers; Washi may write any currency code. */
export const NUMBER_FORMATS: NumberFormatChoice[] = [
  { value: '', label: '1,234', name: 'Plain number' },
  { value: 'percent', label: '%', name: 'Percent' },
  { value: 'USD', label: '$', name: 'US dollar' },
  { value: 'EUR', label: '€', name: 'Euro' },
  { value: 'GBP', label: '£', name: 'Pound sterling' },
  { value: 'JPY', label: '¥', name: 'Yen' },
]

export const PROPERTY_PANEL_WIDTH = 280
export const PROPERTY_PANEL_GAP = 6
export const PROPERTY_PANEL_MARGIN = 8
/** Below this much room under the +, the panel opens above it instead (px). */
export const PROPERTY_PANEL_ROOM = 360

/** A new status property starts with Notion's three steps. */
export const DEFAULT_STATUS_GROUPS = {
  todo: ['Not started'],
  doing: ['In progress'],
  done: ['Done'],
}

/** The rows a relation's menu offers and its chips are named from. */
export const RELATION_CHOICE_LIMIT = 500

/** A status's groups as Notion names them in its options. */
export const STATUS_GROUP_LABELS: { group: StatusGroup; label: string }[] = [
  { group: 'todo', label: 'To-do' },
  { group: 'doing', label: 'In progress' },
  { group: 'done', label: 'Complete' },
]

/** Rows counted before an option goes; past this the warning says "at least". */
export const OPTION_USE_LIMIT = 1000
