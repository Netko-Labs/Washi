import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  clearAgentHistory,
  clearCapabilityLedger,
  createSession,
  createSheet,
  eraseWorkspace,
  listSheets,
  openWorkspace,
  recordCapability,
  searchSheets,
  type Workspace,
  workspaceStats,
} from '../index'

let ws: Workspace

beforeEach(() => {
  ws = openWorkspace({ id: 'test', path: ':memory:' })
  createSheet(
    ws,
    { title: 'Kept', source: '<Sheet title="Kept"><H1>Kept</H1></Sheet>' },
    { body: 'Kept', refs: [] },
  )
  createSession(ws, 'a session')
  recordCapability(ws, { origin: 'sheet', subject: 'table.insert', decision: 'auto' })
})
afterEach(() => ws.close())

describe('workspace maintenance', () => {
  test('clearing agent history keeps sheets', () => {
    clearAgentHistory(ws)
    expect(workspaceStats(ws).sessions).toBe(0)
    expect(listSheets(ws)).toHaveLength(1)
  })

  test('clearing the ledger keeps everything else', () => {
    clearCapabilityLedger(ws)
    const stats = workspaceStats(ws)
    expect(stats.capabilityCalls).toBe(0)
    expect(stats.sheets).toBe(1)
    expect(stats.sessions).toBe(1)
  })

  test('erasing the workspace empties every counted table', () => {
    expect(workspaceStats(ws).sheets).toBe(1)
    eraseWorkspace(ws)
    expect(workspaceStats(ws)).toEqual({
      sheets: 0,
      tables: 0,
      records: 0,
      sessions: 0,
      turns: 0,
      approvals: 0,
      capabilityCalls: 0,
      oplogEntries: 0,
    })
  })

  test('erasing clears the search index too, not just the rows', () => {
    expect(searchSheets(ws, 'Kept')).toHaveLength(1)
    eraseWorkspace(ws)
    expect(searchSheets(ws, 'Kept')).toEqual([])
  })

  test('the workspace is usable again after erasing', () => {
    eraseWorkspace(ws)
    createSheet(
      ws,
      { title: 'Fresh', source: '<Sheet title="Fresh"><H1>Fresh</H1></Sheet>' },
      { body: 'Fresh', refs: [] },
    )
    expect(listSheets(ws).map((sheet) => sheet.title)).toEqual(['Fresh'])
    expect(searchSheets(ws, 'Fresh')).toHaveLength(1)
  })
})
