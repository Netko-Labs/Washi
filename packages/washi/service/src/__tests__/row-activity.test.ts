import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test'
import { openWorkspace, restoreRecords, type Workspace } from '@washi/repository'
import { AgentHost } from '../agents/host'
import { rowActivity } from '../tables/activity'
import {
  defineUserTable,
  deleteRecord,
  runMutation,
  runQuery,
  toggleTaskRecord,
} from '../tables/service'

let ws: Workspace
let water: string
const at = (day: number) => setSystemTime(new Date(Date.UTC(2026, 9, day)))

beforeEach(() => {
  at(1)
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  defineUserTable(ws, {
    name: 'bills',
    columns: [
      { name: 'name', type: 'text' },
      { name: 'paid', type: 'boolean' },
      { name: 'amount', type: 'number' },
      { name: 'doubled', type: 'formula', expr: 'amount * 2' },
    ],
  })
  runMutation(ws, { kind: 'insert', table: 'bills', data: { name: 'Water', amount: 30 } }, 'juan')
  water = String(runQuery(ws, { table: 'bills' }).rows[0]?.id)
})
afterEach(() => {
  ws.close()
  setSystemTime()
})

describe('a row says who changed it, when, and from what (D78)', () => {
  test('consecutive versions diff into fields; computed columns never show', () => {
    at(3)
    toggleTaskRecord(ws, water, true, 'paid', 'juan')
    at(5)
    runMutation(
      ws,
      {
        kind: 'update',
        table: 'bills',
        where: [{ column: 'id', op: 'eq', value: water }],
        data: { amount: 32.5 },
      },
      'washi',
    )

    const { changes, more } = rowActivity(ws, water)
    expect(more).toBe(false)
    expect(changes).toEqual([
      {
        atMs: Date.UTC(2026, 9, 5),
        by: 'washi',
        kind: 'edited',
        fields: [{ column: 'amount', from: 30, to: 32.5 }],
      },
      {
        atMs: Date.UTC(2026, 9, 3),
        by: 'juan',
        kind: 'edited',
        fields: [{ column: 'paid', from: null, to: true }],
      },
      {
        atMs: Date.UTC(2026, 9, 1),
        by: 'juan',
        kind: 'created',
        fields: [
          { column: 'name', from: null, to: 'Water' },
          { column: 'amount', from: null, to: 30 },
        ],
      },
    ])
    expect(changes.flatMap((change) => change.fields.map((field) => field.column))).not.toContain(
      'doubled',
    )
  })

  test('a write that changed nothing leaves no entry', () => {
    runMutation(
      ws,
      {
        kind: 'update',
        table: 'bills',
        where: [{ column: 'id', op: 'eq', value: water }],
        data: { amount: 30 },
      },
      'juan',
    )
    expect(rowActivity(ws, water).changes).toHaveLength(1)
  })

  test('a version from before authors were kept reads as nobody in particular', () => {
    ws.sqlite.query('UPDATE record_changes SET author = NULL').run()
    expect(rowActivity(ws, water).changes[0]?.by).toBeNull()
  })

  test('a backfilled snapshot is a baseline, never a fabricated "added this row"', () => {
    // What backfillChanges leaves for a row the oplog never saw: one version, at its last edit.
    ws.sqlite.query('DELETE FROM record_changes').run()
    at(9)
    ws.sqlite
      .query(
        'INSERT INTO record_changes (table_id, record_id, data, at_ms) SELECT table_id, id, data, ? FROM records',
      )
      .run(Date.now())
    expect(rowActivity(ws, water).changes).toEqual([])
    at(10)
    toggleTaskRecord(ws, water, true, 'paid', 'juan')
    const [paid] = rowActivity(ws, water).changes
    expect(paid?.kind).toBe('edited')
    expect(paid?.fields).toEqual([{ column: 'paid', from: null, to: true }])
  })

  test('newest first, cut at the limit, and says when there is more', () => {
    for (const amount of [31, 32, 33, 34]) {
      runMutation(
        ws,
        {
          kind: 'update',
          table: 'bills',
          where: [{ column: 'id', op: 'eq', value: water }],
          data: { amount },
        },
        'juan',
      )
    }
    const { changes, more } = rowActivity(ws, water, 2)
    expect(more).toBe(true)
    expect(changes.map((change) => change.fields[0]?.to)).toEqual([34, 33])
  })

  test('a page action signs as the person who pressed; an agent action as Washi', async () => {
    const host = new AgentHost(ws)
    const set = (amount: number) => ({
      verb: 'table.update',
      table: 'bills',
      row: water,
      set: { amount },
    })
    await host.executeAction(set(40), { origin: 'sheet', actorId: 'ana' })
    await host.executeAction(set(41), { origin: 'agent' })
    expect(rowActivity(ws, water, 2).changes.map((change) => change.by)).toEqual(['washi', 'ana'])
  })

  test('an unknown row is refused', () => {
    expect(() => rowActivity(ws, 'nope')).toThrow('unknown record')
  })
})

describe('a row that comes back', () => {
  test('reads as restored after its removal, never as added again', () => {
    at(3)
    deleteRecord(ws, 'bills', water, 'm1')
    at(4)
    restoreRecords(ws, [water], 'm2')
    const { changes } = rowActivity(ws, water)
    expect(changes.map((each) => [each.kind, each.by])).toEqual([
      ['restored', 'm2'],
      ['deleted', 'm1'],
      ['created', 'juan'],
    ])
  })
})
