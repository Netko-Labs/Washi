import type { RowActivity, RowFieldChange, RowOf } from '@washi/domain'
import type { Person } from '@washi/paper'

export interface RowActivityProps {
  rowOf: RowOf
  people: Person[]
}

export interface LoadedActivity {
  recordId: string
  activity: RowActivity | null
}

export interface RowActivityState {
  activity: RowActivity
  showMore: () => void
}

export interface PhraseContext {
  spec: RowOf['table']['spec']
  people: Person[]
  related: RowOf['related']
}

export type ActivityCell = RowFieldChange['to']
export type ActivityColumn = PhraseContext['spec']['columns'][number]

export interface ActivityEntry {
  key: string
  who: string
  what: string
  time: string
}

export interface ActivityDay {
  label: string
  entries: ActivityEntry[]
}
