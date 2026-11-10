import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import type { ColumnSpec } from '@washi/ink'
import { openWorkspace, type Workspace } from '@washi/repository'
import { rowActivity } from '../../activity'
import { defineUserTable, runMutation, runQuery } from '../../service'
import { importRows } from '../import-rows'
import { coerceCell, csvRecords, parseNumber, readJson, readSource, sniffDelimiter } from '../utils'

describe('CSV as RFC 4180 reads it', () => {
  test('quotes, escaped quotes, line breaks inside a quote, CRLF and a BOM', () => {
    const text = '﻿title,notes\r\n"Fix, the login","said ""now""\r\nand later"\r\nplain,\r\n'
    expect(csvRecords(text, ',')).toEqual([
      { line: 1, cells: ['title', 'notes'] },
      { line: 2, cells: ['Fix, the login', 'said "now"\r\nand later'] },
      { line: 4, cells: ['plain', ''] },
    ])
  })

  test('the separator is read off the first line: a tab, a semicolon, else a comma', () => {
    expect(sniffDelimiter('a\tb\tc\n1\t2\t3')).toBe('\t')
    expect(sniffDelimiter('a;b;c\n1,5;2;3')).toBe(';')
    expect(sniffDelimiter('a,b\n1,2')).toBe(',')
  })

  test('blank lines are skipped, a short row leaves the rest empty, a long one is refused', () => {
    const read = readSource({ text: 'a,b\n1,2\n\n3\n4,5,6\n7,8,\n' })
    expect(read.names).toEqual(['a', 'b'])
    expect(read.rows.map((row) => row.fields)).toEqual([
      { a: '1', b: '2' },
      { a: '3', b: '' },
      { a: '7', b: '8' },
    ])
    expect(read.refused).toEqual([{ row: 3, line: 5, why: expect.stringContaining('3 cells') }])
  })

  test('a quote that never closes is said with its line', () => {
    expect(() => csvRecords('a\n"open', ',')).toThrow('line 2')
  })
})

describe('JSON', () => {
  test('an array, { rows }, or JSON Lines', () => {
    expect(readJson('[{"a":1}]', undefined).rows).toHaveLength(1)
    expect(readJson('{"rows":[{"a":1},{"a":2}]}', undefined).rows).toHaveLength(2)
    const lines = readJson('{"a":1}\n\n{"a":2}\nnope\n', undefined)
    expect(lines.rows.map((row) => row.line)).toEqual([1, 3])
    expect(lines.refused).toEqual([{ row: 3, line: 4, why: 'not JSON' }])
  })

  test('a JSON Lines row is its place among non-blank lines: a refused line never shares one', () => {
    const read = readJson('{"a":1}\nbad\n{"a":2}\n', true)
    expect(read.refused).toEqual([{ row: 2, line: 2, why: 'not JSON' }])
    expect(read.rows.map((row) => row.row)).toEqual([1, 3])
  })

  test('a file past the cap is refused as soon as it passes it, never read whole', () => {
    const csv = `title\n${'x\n'.repeat(20_001)}`
    expect(() => readSource({ text: csv })).toThrow('more than 20,000 rows')
    expect(() => readSource({ text: `title\n${'x\n'.repeat(20_000)}` })).not.toThrow()
    expect(() => readJson('{"a":1}\n'.repeat(20_001), true)).toThrow('split the file')
    expect(() =>
      readJson(JSON.stringify(Array.from({ length: 20_001 }, () => ({}))), undefined),
    ).toThrow('split the file')
  })

  test('something not a list of rows is said', () => {
    expect(() => readJson('{"a":1}', false)).toThrow('array of objects')
  })
})

describe('cells as people write them', () => {
  test('numbers: thousands only where they group by three', () => {
    expect(parseNumber('1,234.5')).toBe(1234.5)
    expect(parseNumber('1.234,5')).toBe(1234.5)
    expect(parseNumber('1.5')).toBe(1.5)
    expect(parseNumber('1,5')).toBe(1.5)
    expect(parseNumber('1 234')).toBe(1234)
    expect(parseNumber('$12')).toBe(12)
    expect(parseNumber('-€3.50')).toBe(-3.5)
    expect(parseNumber('25%')).toBe(0.25)
    expect(parseNumber('12abc')).toBeNull()
  })

  const col = (spec: Partial<ColumnSpec> & Pick<ColumnSpec, 'type'>) =>
    ({ name: 'c', ...spec }) as ColumnSpec

  test('yes/no words, choices spelt as the column spells them, lists split', () => {
    expect(coerceCell(col({ type: 'boolean' }), '✓')).toEqual({ value: true })
    expect(coerceCell(col({ type: 'boolean' }), 'No')).toEqual({ value: false })
    expect(coerceCell(col({ type: 'boolean' }), 'maybe')).toHaveProperty('why')
    expect(coerceCell(col({ type: 'select', options: ['High'] }), ' high ')).toEqual({
      value: 'High',
    })
    expect(
      coerceCell(col({ type: 'multi_select', options: ['UI', 'API'] }), 'ui; api, ui'),
    ).toEqual({ value: ['UI', 'API'] })
    expect(coerceCell(col({ type: 'number' }), '')).toEqual({ skip: true })
    expect(coerceCell(col({ type: 'text' }), 42)).toEqual({ value: '42' })
  })
})

let ws: Workspace

beforeEach(() => {
  ws = openWorkspace({ id: 'import', path: ':memory:' })
  defineUserTable(ws, {
    name: 'tasks',
    columns: [
      { name: 'title', type: 'text' },
      {
        name: 'status',
        type: 'status',
        groups: { todo: ['Todo'], doing: ['Doing'], done: ['Done'] },
      },
      { name: 'points', type: 'number' },
      { name: 'urgent', type: 'boolean' },
      { name: 'double', type: 'formula', expr: 'points * 2' },
    ],
  })
})

afterEach(() => ws.close())

describe('importRows (D137)', () => {
  test('matches columns by name or map, refuses a row in words, signs the rest', () => {
    const csv =
      'Title,Status,Story points,Urgent,double,id,extra\nOne,todo,"1,000",yes,9,x,?\nTwo,Nope,2,no,,,\n'
    const result = importRows(
      ws,
      'tasks',
      { text: csv },
      { map: { 'Story points': 'points' } },
      'u-ana',
    )
    expect(result.inserted).toBe(1)
    expect(result.refused).toEqual([
      { row: 2, line: 3, why: expect.stringContaining('expected one of: Todo, Doing, Done') },
    ])
    expect(result.columns).toEqual({
      Title: 'title',
      Status: 'status',
      'Story points': 'points',
      Urgent: 'urgent',
    })
    expect(result.ignoredColumns.map((each) => each.column)).toEqual(['double', 'id', 'extra'])
    const [row] = runQuery(ws, { table: 'tasks' }).rows
    expect(row).toMatchObject({ title: 'One', status: 'Todo', points: 1000, urgent: true })
    expect(rowActivity(ws, String(row?.id)).changes[0]).toMatchObject({ by: 'u-ana' })
  })

  test('more than 500 rows go in batches; a dry run writes nothing', () => {
    const rows = Array.from({ length: 1201 }, (_, at) => ({ title: `Row ${at + 1}`, points: at }))
    const dry = importRows(ws, 'tasks', { text: '', rows }, { dryRun: true }, 'u-ana')
    expect(dry).toMatchObject({ dryRun: true, inserted: 0, wouldInsert: 1201 })
    expect(dry.sample).toHaveLength(3)
    expect(runQuery(ws, { table: 'tasks' }).rows).toHaveLength(0)

    const result = importRows(ws, 'tasks', { text: '', rows }, {}, 'u-ana')
    expect(result.batches).toEqual([
      { from: 1, to: 500, inserted: 500 },
      { from: 501, to: 1000, inserted: 500 },
      { from: 1001, to: 1201, inserted: 201 },
    ])
    expect(result.idsTotal).toBe(1201)
    expect(result.ids).toHaveLength(500)
  })

  test('a batch the write refuses is said with its rows, and the next goes on', () => {
    defineUserTable(ws, {
      name: 'people',
      columns: [{ name: 'name', type: 'text' }],
    })
    defineUserTable(ws, {
      name: 'owned',
      columns: [
        { name: 'title', type: 'text' },
        { name: 'owner', type: 'relation', table: 'people' },
      ],
    })
    runMutation(ws, { kind: 'insert', table: 'people', data: { name: 'Ana' } })
    const rows = Array.from({ length: 600 }, (_, at) => ({
      title: `T${at + 1}`,
      owner: at === 10 ? 'Nobody' : 'Ana',
    }))
    const result = importRows(ws, 'owned', { text: '', rows }, {}, 'u-ana')
    expect(result.batches[0]).toMatchObject({ from: 1, to: 500 })
    expect(result.batches[0]?.error).toContain('Nobody')
    expect(result.batches[1]).toEqual({ from: 501, to: 600, inserted: 100 })
    expect(result.inserted).toBe(100)
  })

  test('a file with none of the table’s columns, or too many rows, is refused whole', () => {
    expect(() => importRows(ws, 'tasks', { text: 'foo,bar\n1,2' }, {}, null)).toThrow(
      'name them with map',
    )
    expect(() => importRows(ws, 'tasks', { text: 'a\n1' }, { map: { a: 'nope' } }, null)).toThrow(
      'not a column of tasks',
    )
    const many = Array.from({ length: 20_001 }, () => ({ title: 'x' }))
    expect(() => importRows(ws, 'tasks', { text: '', rows: many }, {}, null)).toThrow('split')
  })
})
