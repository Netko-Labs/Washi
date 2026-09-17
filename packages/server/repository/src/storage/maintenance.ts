import type { Workspace } from './client'

/**
 * Developer-only workspace maintenance. These bypass the oplog on purpose — they
 * exist to get back to a known state, not to record history, so nothing here
 * should ever be reachable from a packaged build (see the Develop menu).
 */

export interface WorkspaceStats {
  sheets: number
  tables: number
  records: number
  sessions: number
  turns: number
  approvals: number
  capabilityCalls: number
  oplogEntries: number
}

function count(ws: Workspace, table: string): number {
  const row = ws.sqlite.query(`SELECT count(*) AS n FROM ${table}`).get() as { n: number } | null
  return row?.n ?? 0
}

export function workspaceStats(ws: Workspace): WorkspaceStats {
  return {
    sheets: count(ws, 'sheets'),
    tables: count(ws, 'user_tables'),
    records: count(ws, 'records'),
    sessions: count(ws, 'agent_sessions'),
    turns: count(ws, 'agent_turns'),
    approvals: count(ws, 'approvals'),
    capabilityCalls: count(ws, 'capability_calls'),
    oplogEntries: count(ws, 'oplog'),
  }
}

/** Transcripts, sessions and approval history. Sheets and tables survive. */
export function clearAgentHistory(ws: Workspace): void {
  for (const table of ['agent_turns', 'agent_sessions', 'approvals']) {
    ws.sqlite.exec(`DELETE FROM ${table}`)
  }
}

export function clearCapabilityLedger(ws: Workspace): void {
  ws.sqlite.exec('DELETE FROM capability_calls')
}

/**
 * Everything the workspace holds. `app_meta` goes too, so the device id is
 * reissued — a wiped workspace is a new device.
 */
export function eraseWorkspace(ws: Workspace): void {
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
  ws.sqlite.exec('BEGIN')
  try {
    for (const table of tables) ws.sqlite.exec(`DELETE FROM ${table}`)
    ws.sqlite.exec('COMMIT')
  } catch (error) {
    ws.sqlite.exec('ROLLBACK')
    throw error
  }
}
