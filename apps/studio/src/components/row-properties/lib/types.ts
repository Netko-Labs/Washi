import type { RowOf } from '@washi/domain'
import type { Person } from '@washi/paper'

export type Column = RowOf['table']['spec']['columns'][number]
export type CellValue = RowOf['row'][string]

export interface RowPropertiesProps {
  sheetId: string
}

export interface RowPage {
  rowOf: RowOf
  people: Person[]
  save: (column: string, value: CellValue) => Promise<void>
}

export interface RowTitleProps {
  value: string
  onSave: (value: string | null) => void
}
