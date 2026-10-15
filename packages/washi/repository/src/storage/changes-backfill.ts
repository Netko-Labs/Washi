import type { Database } from 'bun:sqlite'

type Data = Record<string, unknown>
type Op = { kind: 'insert'; data: Data } | { kind: 'update'; patch: Data } | { kind: 'delete' }

interface Orphan {
  id: string
  table_id: string
  data: string
  hlc_updated: string
  deleted_at: string | null
}

const atMs = (hlc: string) => Number(hlc.slice(0, 14))

/**
 * Rows older than the change log get their real past, replayed from the oplog — every insert
 * and patch is there with its time. A row the oplog never saw is known only from its last edit.
 */
export function backfillChanges(sqlite: Database): void {
  const orphans = sqlite
    .query(
      `SELECT id, table_id, data, hlc_updated, deleted_at FROM records r
       WHERE NOT EXISTS (SELECT 1 FROM record_changes c WHERE c.record_id = r.id)`,
    )
    .all() as Orphan[]
  if (orphans.length === 0) return

  const ops = new Map<string, { op: Op; at: number }[]>()
  const logged = sqlite
    .query(
      `SELECT entity_id, op_id, op FROM oplog WHERE entity = 'record' AND entity_id IN (
         SELECT id FROM records r
         WHERE NOT EXISTS (SELECT 1 FROM record_changes c WHERE c.record_id = r.id)
       ) ORDER BY seq`,
    )
    .all() as { entity_id: string; op_id: string; op: string }[]
  for (const row of logged) {
    const list = ops.get(row.entity_id) ?? []
    list.push({ op: JSON.parse(row.op) as Op, at: atMs(row.op_id) })
    ops.set(row.entity_id, list)
  }

  const insert = sqlite.query(
    'INSERT INTO record_changes (table_id, record_id, data, at_ms) VALUES (?, ?, ?, ?)',
  )
  sqlite.transaction(() => {
    for (const row of orphans) {
      const past = ops.get(row.id) ?? []
      let state: Data | null = null
      for (const { op, at } of past) {
        if (op.kind === 'insert') state = op.data
        else if (op.kind === 'update') state = { ...(state ?? {}), ...op.patch }
        else state = null
        insert.run(row.table_id, row.id, state === null ? null : JSON.stringify(state), at)
      }
      if (past.length > 0) continue
      insert.run(row.table_id, row.id, row.data, atMs(row.hlc_updated))
      if (row.deleted_at) insert.run(row.table_id, row.id, null, atMs(row.deleted_at))
    }
  })()
}
