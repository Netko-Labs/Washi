import type { RowOf } from '@washi/domain'

export type Column = RowOf['table']['spec']['columns'][number]
export type CellValue = RowOf['row'][string]

export interface RowPropertiesProps {
  sheetId: string
}

export interface PropertyValueProps {
  column: Column
  value: CellValue | undefined
  related: Record<string, string>
  people: Record<string, string>
}

export type StatusGroup = 'todo' | 'doing' | 'done'
