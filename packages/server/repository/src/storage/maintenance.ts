import { getSqlite } from './client'

/**
 * Developer-only vault maintenance. These bypass the oplog on purpose — they
 * exist to get back to a known state, not to record history, so nothing here
 * should ever be reachable from a packaged build (see the Develop menu).
 */

export interface VaultStats {
  sheets: number
  tables: number
  records: number
  sessions: number
  turns: number
  approvals: number
  capabilityCalls: number
  oplogEntries: number
}

function count(table: string): number {
  const row = getSqlite().query(`SELECT count(*) AS n FROM ${table}`).get() as { n: number } | null
  return row?.n ?? 0
}

export function vaultStats(): VaultStats {
  return {
    sheets: count('sheets'),
    tables: count('user_tables'),
    records: count('records'),
    sessions: count('agent_sessions'),
    turns: count('agent_turns'),
    approvals: count('approvals'),
    capabilityCalls: count('capability_calls'),
    oplogEntries: count('oplog'),
  }
}

/** Transcripts, sessions and approval history. Sheets and tables survive. */
export function clearAgentHistory(): void {
  const sqlite = getSqlite()
  for (const table of ['agent_turns', 'agent_sessions', 'approvals']) {
    sqlite.exec(`DELETE FROM ${table}`)
  }
}

export function clearCapabilityLedger(): void {
  getSqlite().exec('DELETE FROM capability_calls')
}

/**
 * Everything the vault holds. `window_state` survives so the window does not
 * jump on the reload that follows; `app_meta` does not, so the device id is
 * reissued — a wiped vault is a new device.
 */
export function eraseVault(): void {
  const sqlite = getSqlite()
  const tables = [
    'sheets_fts',
    'sheet_links',
    'sheets',
    'records',
    'user_tables',
    'agent_turns',
    'agent_sessions',
    'approvals',
    'capability_calls',
    'oplog',
    'app_meta',
  ]
  sqlite.exec('BEGIN')
  try {
    for (const table of tables) sqlite.exec(`DELETE FROM ${table}`)
    sqlite.exec('COMMIT')
  } catch (error) {
    sqlite.exec('ROLLBACK')
    throw error
  }
}
