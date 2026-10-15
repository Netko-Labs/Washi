import { afterEach, beforeEach, describe, expect, setSystemTime, test } from 'bun:test'
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
afterEach(() => {
  setSystemTime()
  ws.close()
})

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

  test('pages carry their icons, the project its dates, the issues their due days', () => {
    seedTeamSpace(ws, { timeZone: 'UTC', actorId: null })
    expect(listSheets(ws).find((sheet) => sheet.title === 'Backlog')?.icon).toBe('kanban')
    expect(runQuery(ws, { table: 'projects' }).rows[0]?.when).toMatch(
      /^\d{4}-\d{2}-\d{2}\/\d{4}-\d{2}-\d{2}$/,
    )
    expect(runQuery(ws, { table: 'issues' }).rows.every((row) => typeof row.due === 'string')).toBe(
      true,
    )
  })

  test('set up after 17:00, the review waits for tomorrow instead of running at once', () => {
    setSystemTime(new Date(Date.UTC(2026, 9, 15, 21)))
    seedTeamSpace(ws, { timeZone: 'UTC', actorId: null })
    expect(listRoutines(ws)[0]?.lastRunDay).toBe('2026-10-15')
  })

  test('set up in the morning, today still gets its review', () => {
    setSystemTime(new Date(Date.UTC(2026, 9, 15, 9)))
    seedTeamSpace(ws, { timeZone: 'UTC', actorId: null })
    expect(listRoutines(ws)[0]?.lastRunDay).toBeNull()
  })

  test("dates start on the asker's day, not UTC's", () => {
    // 22:00 in Bogotá is already tomorrow in UTC.
    setSystemTime(new Date(Date.UTC(2026, 9, 16, 3)))
    seedTeamSpace(ws, { timeZone: 'America/Bogota', actorId: null })
    expect(String(runQuery(ws, { table: 'projects' }).rows[0]?.when)).toStartWith('2026-10-15/')
  })
})
