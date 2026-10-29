import type { PropertyType } from './types'

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
