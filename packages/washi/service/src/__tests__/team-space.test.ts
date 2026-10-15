import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  listRoutines,
  listSheets,
  listTables,
  openWorkspace,
  type Workspace,
} from '@washi/repository'
import { InkError } from '../tables/errors'
import { runQuery } from '../tables/service'
import { seedTeamSpace } from '../tables/team-space'

let ws: Workspace
beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
})
afterEach(() => ws.close())

describe('a team space on day one', () => {
  test('backlog, roadmap, wiki, ideas and a review — every page valid, a routine to keep it', () => {
    const { backlog } = seedTeamSpace(ws, { timeZone: 'Europe/Madrid', actorId: 'user-1' })
    const titles = listSheets(ws)
      .map((sheet) => sheet.title)
      .sort()
    expect(titles).toEqual(['Backlog', 'How we work', 'Ideas', 'Roadmap', 'Weekly review', 'Wiki'])
    expect(listSheets(ws).find((sheet) => sheet.id === backlog)?.title).toBe('Backlog')
    expect(
      listTables(ws)
        .map((table) => table.name)
        .sort(),
    ).toEqual(['issues', 'projects'])
    expect(runQuery(ws, { table: 'issues' }).rows[0]).toMatchObject({
      project: [expect.any(String)],
    })
    expect(listRoutines(ws)).toMatchObject([
      { title: 'Weekly review', timeZone: 'Europe/Madrid', minuteOfDay: 1020 },
    ])
  })

  test('never twice, never over a team that already tracks issues', () => {
    seedTeamSpace(ws, { timeZone: 'UTC', actorId: null })
    expect(() => seedTeamSpace(ws, { timeZone: 'UTC', actorId: null })).toThrow(InkError)
  })
})
