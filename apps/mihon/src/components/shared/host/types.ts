import type { QueryRow, TableSpec } from '@washi/ink'

export interface SeedTable {
  spec: TableSpec
  rows: QueryRow[]
}

export interface MemoryTable {
  spec: TableSpec
  rows: QueryRow[]
  /** Ids never come back: a deleted row's id stays dead. */
  next: number
}

export type Say = (message: string) => void
