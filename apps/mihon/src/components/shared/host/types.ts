import type { QueryRow, TableSpec } from '@washi/ink'

export interface SeedTable {
  spec: TableSpec
  rows: QueryRow[]
}

export interface MemoryTable {
  spec: TableSpec
  rows: QueryRow[]
}

export type Say = (message: string) => void
