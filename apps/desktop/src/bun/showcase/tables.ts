import { getTableByName } from '@washi/desktop-repository'
import { defineUserTable, runMutation } from '@washi/desktop-service'
import type { RecordData, TableSpec } from '@washi/ink'
import { ISSUE_EXTRAS, ISSUES_SEED } from './jira-seed'
import { LIFE_SEEDS } from './seeds-life'
import { WORK_SEEDS } from './seeds-work'

export interface TableSeed {
  spec: TableSpec
  rows: RecordData[]
}

/** The tables the reference apps bind to (WSX Apps.dc.html). Seeded once; edits survive reseeds. */
export function seedTables(): void {
  for (const seed of [...WORK_SEEDS, ...LIFE_SEEDS, ISSUES_SEED, ...ISSUE_EXTRAS]) {
    if (getTableByName(seed.spec.name)) continue
    defineUserTable(seed.spec)
    for (const row of seed.rows) runMutation({ kind: 'insert', table: seed.spec.name, data: row })
  }
}
