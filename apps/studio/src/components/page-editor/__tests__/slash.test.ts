import { describe, expect, test } from 'bun:test'
import { paperRegistry } from '@washi/paper/registry'
import { parse, serialize, validate } from '@washi/wsx'
import { newColumns } from '../lib/columns'
import { toBlocks, toSheet } from '../lib/convert'
import type { SlashOption } from '../lib/types'
import { dataNode, slashMatches } from '../lib/utils'
import { SLASH_GROUP_ORDER } from '../lib/values'

const TABLES = [
  { name: 'issues', done: { column: 'state', values: ['Done'] } },
  { name: 'team_notes', done: null },
]
const PAGES = [
  { id: 'p1', title: 'Roadmap' },
  { id: 'p2', title: 'Retro notes' },
  { id: 'self', title: 'This page' },
]
const groupsOf = (options: SlashOption[]) => [...new Set(options.map((option) => option.group))]
const labelsOf = (options: SlashOption[]) => options.map((option) => option.label)

describe('the / menu in groups', () => {
  test('an empty query lists every group in order, each row once', () => {
    const options = slashMatches('', { tables: TABLES, pages: PAGES })
    expect(groupsOf(options)).toEqual(SLASH_GROUP_ORDER)
    const keys = options.map((option) => (option.type === 'text' ? option.kind : option.key))
    expect(new Set(keys).size).toBe(keys.length)
  })

  test('tables never flood it: one entry each opens a step that lists them', () => {
    const options = slashMatches('', { tables: TABLES })
    expect(options.some((option) => option.label.includes('issues'))).toBe(false)
    const steps = options.filter((option) => option.type === 'step').map((option) => option.label)
    expect(steps).toEqual(['Link to page…', 'Linked view…', 'Progress…', 'Include…', 'Automation…'])
    expect(slashMatches('view', { tables: TABLES })[0]).toMatchObject({
      type: 'step',
      step: 'view',
    })
  })

  test('filtering keeps the groups in order and leaves out the empty ones', () => {
    const options = slashMatches('code')
    expect(groupsOf(options)).toEqual(['basic', 'code'])
    expect(labelsOf(options)).toEqual(['Code', 'Page code', 'Widget'])
    expect(slashMatches('zzz')).toEqual([])
  })

  test('hints read plainly', () => {
    const hint = (key: string) =>
      slashMatches('').find((option) => option.type !== 'text' && option.key === key)?.hint
    expect(hint('terminal')).toBe('Run a Node script')
    expect(hint('page-code')).toBe('Code that draws this page')
  })

  test('a table step lists tables and typing filters them', () => {
    const view = slashMatches('', { tables: TABLES, step: 'view' })
    expect(labelsOf(view)).toEqual(['issues', 'team notes'])
    expect(labelsOf(slashMatches('note', { tables: TABLES, step: 'view' }))).toEqual(['team notes'])
    expect(slashMatches('', { tables: TABLES, step: 'automation' })[0]).toMatchObject({
      pick: { kind: 'automation', table: 'issues' },
    })
    expect(labelsOf(slashMatches('', { tables: TABLES, step: 'progress' }))).toEqual(['issues'])
  })

  test('a page step lists pages; include never offers the page into itself', () => {
    const include = slashMatches('', { pages: PAGES, step: 'include', selfId: 'self' })
    expect(labelsOf(include)).toEqual(['Roadmap', 'Retro notes'])
    expect(slashMatches('retro', { pages: PAGES, step: 'include' })[0]).toMatchObject({
      pick: { kind: 'include', sheet: 'p2' },
    })
    const link = slashMatches('', { pages: PAGES, step: 'link', selfId: 'self' })
    expect(link.map((option) => option.type === 'data' && option.pick)).toContainEqual({
      kind: 'link',
      sheet: 'p1',
    })
  })
})

describe('layout from /', () => {
  test('/2 columns and /3 columns, only on the page itself', () => {
    expect(labelsOf(slashMatches('columns'))).toEqual(['2 columns', '3 columns'])
    expect(slashMatches('columns', { isNested: true })).toEqual([])
    expect(slashMatches('bento')[0]).toMatchObject({ pick: { kind: 'starter', block: 'bento' } })
  })

  test('columns drop in as columns the editor types into, and save valid', () => {
    const made = newColumns(3)
    expect(made.columns.map((column) => column.blocks.length)).toEqual([1, 1, 1])
    const root = parse('<Sheet title="T" wsx="1"><Title>T</Title></Sheet>')
    const source = serialize(toSheet(root, [...toBlocks(root), made]))
    expect(validate(parse(source), paperRegistry)).toEqual([])
    expect(toBlocks(parse(source)).at(-1)?.kind).toBe('columns')
  })

  test('outline, backlinks and include land as valid blocks', () => {
    for (const pick of [
      { kind: 'outline' as const },
      { kind: 'backlinks' as const },
      { kind: 'include' as const, sheet: 'p1' },
    ]) {
      const sheet = {
        kind: 'element' as const,
        name: 'Sheet',
        props: { title: 't' },
        children: [dataNode(pick)],
      }
      expect({ pick, diagnostics: validate(sheet, paperRegistry) }).toEqual({
        pick,
        diagnostics: [],
      })
    }
  })
})
