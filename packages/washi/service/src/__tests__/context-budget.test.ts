import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import { openWorkspace, type Workspace } from '@washi/repository'
import { createSheetFromSource, defineUserTable, runMutation, workspaceContext } from '../index'

const MEMBER = { id: 'u-ana', isOwner: false }

let ws: Workspace

beforeEach(() => {
  ws = openWorkspace({ id: 'big', path: ':memory:' })
})
afterEach(() => ws.close())

const status = {
  name: 'status',
  type: 'status' as const,
  groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
}

const insert = (table: string, rows: Record<string, string | number>[]) => {
  for (let at = 0; at < rows.length; at += 500) {
    runMutation(ws, { kind: 'insert', table, data: rows.slice(at, at + 500) }, MEMBER.id)
  }
}

describe('context_get keeps to maxChars on a large workspace (D135)', () => {
  test('400 pages and 60 tables: never past maxChars, the rest counted and named', () => {
    let parent: string | null = null
    for (let at = 0; at < 400; at++) {
      const id: string = createSheetFromSource(
        ws,
        {
          title: `Page ${at}`,
          source: `<Sheet title="Page ${at}"><Section title="Part ${at}"><Text>${'Some words about this page. '.repeat(30)}</Text></Section></Sheet>`,
        },
        at % 20 === 0 ? null : parent,
      ).id
      if (at % 20 === 0) parent = id
    }
    for (let at = 0; at < 60; at++) {
      const name = `table_${at}`
      defineUserTable(ws, {
        name,
        columns: [
          { name: 'title', type: 'text' },
          status,
          { name: 'area', type: 'select', options: ['A', 'B', 'C'] },
        ],
      })
      insert(
        name,
        Array.from({ length: 20 }, (_, row) => ({
          title: `Row ${row} of ${name}`,
          status: row % 3 ? 'Todo' : 'Done',
          area: 'A',
        })),
      )
    }
    for (const maxChars of [2_000, 15_000, 40_000]) {
      const started = performance.now()
      const out = workspaceContext(ws, MEMBER, { maxChars })
      expect(out.length).toBeLessThanOrEqual(maxChars)
      expect(performance.now() - started).toBeLessThan(5_000)
      expect(out).toContain('## Left out')
    }
    const out = workspaceContext(ws, MEMBER, { maxChars: 15_000 })
    expect(out).toMatch(/\d+ pages not read here — sheet_list names them/)
    expect(out).toMatch(/… \d+ more tables — db_list_tables/)
    expect(out).toMatch(/… \d+ more pages — sheet_list/)
    expect(out).not.toContain('Cut at maxChars')
  })
})

describe('open rows of a big table (D135)', () => {
  test('1,200 rows, the oldest 1,000 done: the 200 open ones, newest first, counted right', () => {
    defineUserTable(ws, { name: 'issues', columns: [{ name: 'title', type: 'text' }, status] })
    insert(
      'issues',
      Array.from({ length: 1_200 }, (_, at) => ({
        title: `Issue ${at + 1}`,
        status: at < 1_000 ? 'Done' : at % 2 ? 'Doing' : 'Todo',
      })),
    )
    const out = workspaceContext(ws, MEMBER, { maxChars: 15_000 })
    expect(out).toContain('- status: Todo 100 · Doing 100 · Done 1000')
    expect(out).toContain('Open rows (200 of 1200')
    expect(out).toContain('**Todo** (100)\n- Issue 1199\n- Issue 1197')
    expect(out).toContain('**Doing** (100)')
    expect(out).not.toContain('- Issue 1000\n')
    expect(out.length).toBeLessThanOrEqual(15_000)
  })
})
