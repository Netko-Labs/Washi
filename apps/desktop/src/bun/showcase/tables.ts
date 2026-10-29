import type { RecordData, TableSpec } from '@washi/ink'
import { getTableByName, type Workspace } from '@washi/repository'
import { defineUserTable, runMutation } from '@washi/service'
import { ISSUE_EXTRAS } from './jira-extras'
import { ISSUES_SEED } from './jira-seed'
import { LIFE_SEEDS } from './seeds-life'
import { WORK_SEEDS } from './seeds-work'

export interface TableSeed {
  spec: TableSpec
  rows: RecordData[]
}

/** The tables the reference apps bind to (WSX Apps.dc.html). Seeded once; edits survive reseeds. */
export function seedTables(ws: Workspace): void {
  for (const seed of [...WORK_SEEDS, ...LIFE_SEEDS, ISSUES_SEED, ...ISSUE_EXTRAS]) {
    if (getTableByName(ws, seed.spec.name)) continue
    defineUserTable(ws, seed.spec)
    for (const row of seed.rows) {
      runMutation(ws, { kind: 'insert', table: seed.spec.name, data: row })
    }
  }
}
