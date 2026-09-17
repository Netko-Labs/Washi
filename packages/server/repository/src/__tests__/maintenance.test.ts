import { afterEach, beforeEach, describe, expect, test } from 'bun:test'
import {
  clearAgentHistory,
  clearCapabilityLedger,
  closeDb,
  createSession,
  createSheet,
  eraseVault,
  initializeDb,
  listSheets,
  recordCapability,
  searchSheets,
  vaultStats,
} from '../index'

beforeEach(() => {
  initializeDb(':memory:')
  createSheet(
    { title: 'Kept', source: '<Sheet title="Kept"><H1>Kept</H1></Sheet>' },
    { body: 'Kept', refs: [] },
  )
  createSession('a session')
  recordCapability({ origin: 'sheet', subject: 'table.insert', decision: 'auto' })
})
afterEach(() => closeDb())

describe('vault maintenance', () => {
  test('clearing agent history keeps sheets', () => {
    clearAgentHistory()
    expect(vaultStats().sessions).toBe(0)
    expect(listSheets()).toHaveLength(1)
  })

  test('clearing the ledger keeps everything else', () => {
    clearCapabilityLedger()
    const stats = vaultStats()
    expect(stats.capabilityCalls).toBe(0)
    expect(stats.sheets).toBe(1)
    expect(stats.sessions).toBe(1)
  })

  test('erasing the vault empties every counted table', () => {
    expect(vaultStats().sheets).toBe(1)
    eraseVault()
    expect(vaultStats()).toEqual({
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
    expect(searchSheets('Kept')).toHaveLength(1)
    eraseVault()
    expect(searchSheets('Kept')).toEqual([])
  })

  test('the vault is usable again after erasing', () => {
    eraseVault()
    createSheet(
      { title: 'Fresh', source: '<Sheet title="Fresh"><H1>Fresh</H1></Sheet>' },
      { body: 'Fresh', refs: [] },
    )
    expect(listSheets().map((sheet) => sheet.title)).toEqual(['Fresh'])
    expect(searchSheets('Fresh')).toHaveLength(1)
  })
})
