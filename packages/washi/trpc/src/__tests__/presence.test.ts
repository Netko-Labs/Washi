import { describe, expect, setSystemTime, test } from 'bun:test'
import { createPresenceBoard, type PagePresence } from '../shared/presence'

const person = (id: string, editing = false): PagePresence => ({
  id,
  name: id,
  editing,
  agent: false,
})

describe('who is on a page', () => {
  test('arrivals and edit-mode switches are announced; a plain heartbeat is not', () => {
    const said: string[][] = []
    const board = createPresenceBoard((_w, _s, people) => said.push(people.map((p) => p.id)))
    board.touch('w', 'page', person('ana'))
    board.touch('w', 'page', person('ana'))
    board.touch('w', 'page', person('ana', true))
    board.touch('w', 'page', person('bo'))
    expect(said).toEqual([['ana'], ['ana'], ['ana', 'bo']])
  })

  test('a missed heartbeat ages out; leaving is immediate; workspaces never mix', () => {
    setSystemTime(new Date(0))
    const board = createPresenceBoard(() => {})
    board.touch('w', 'page', person('ana'), 1000)
    board.touch('w', 'page', person('bo'))
    board.touch('other', 'page', person('cy'))
    setSystemTime(new Date(2000))
    expect(board.list('w', 'page').map((p) => p.id)).toEqual(['bo'])
    board.leave('w', 'page', 'bo')
    expect(board.list('w', 'page')).toEqual([])
    expect(board.list('other', 'page').map((p) => p.id)).toEqual(['cy'])
    setSystemTime()
  })
})
