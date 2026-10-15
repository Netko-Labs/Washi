import type { ColumnSpec } from './types'

export const PROPERTY_TYPES: { type: ColumnSpec['type']; label: string }[] = [
  { type: 'text', label: 'Text' },
  { type: 'number', label: 'Number' },
  { type: 'status', label: 'Status' },
  { type: 'select', label: 'Select' },
  { type: 'multi_select', label: 'Multi-select' },
  { type: 'date', label: 'Date' },
  { type: 'person', label: 'Person' },
  { type: 'boolean', label: 'Checkbox' },
  { type: 'url', label: 'URL' },
]

/** A new status property starts with Notion's three steps. */
export const DEFAULT_STATUS_GROUPS = {
  todo: ['Not started'],
  doing: ['In progress'],
  done: ['Done'],
}
