import type { RecordData, TableSpec } from '@washi/ink'

export interface Seed {
  title: string
  icon: string
  source: string
}

export interface TableSeed {
  spec: TableSpec
  rows: RecordData[]
}
