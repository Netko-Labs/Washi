import type { Database } from 'bun:sqlite'
import type { AgentUpdate, ChatSearchHit } from '@washi/domain'
import type { Workspace } from './client'

const INDEXED_KEY = 'chat_search_indexed'
const SNIPPET_TOKENS = 12

/** One row per chat: its title and everything said in it, rebuilt whole after each turn. */
export function ensureChatSearch(sqlite: Database): void {
  sqlite.exec(`
    CREATE VIRTUAL TABLE IF NOT EXISTS agent_sessions_fts USING fts5(
      session_id UNINDEXED, title, body, tokenize = 'unicode61 remove_diacritics 2'
    )
  `)
  const indexed = sqlite.query('SELECT 1 FROM app_meta WHERE key = ?').get(INDEXED_KEY)
  if (indexed) return
  const sessions = sqlite.query('SELECT id FROM agent_sessions').all() as { id: string }[]
  for (const { id } of sessions) writeIndex(sqlite, id)
  sqlite.query("INSERT INTO app_meta (key, value) VALUES (?, '1')").run(INDEXED_KEY)
}

export function indexChatSearch(ws: Workspace, sessionId: string): void {
  writeIndex(ws.sqlite, sessionId)
}

export function forgetChatSearch(ws: Workspace, sessionId: string): void {
  ws.sqlite.query('DELETE FROM agent_sessions_fts WHERE session_id = ?').run(sessionId)
}

/** Every word must appear, each as a prefix; FTS syntax in the query is taken literally. */
export function searchChats(
  ws: Workspace,
  viewerId: string | null,
  text: string,
  limit: number,
): ChatSearchHit[] {
  const match = text
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => `"${word.replaceAll('"', '""')}"*`)
    .join(' ')
  if (!match) return []
  return ws.sqlite
    .query(
      `SELECT s.id AS sessionId, s.title AS title, s.updated_at AS updatedAt,
         snippet(agent_sessions_fts, 2, '⟦', '⟧', '…', ${SNIPPET_TOKENS}) AS snippet
       FROM agent_sessions_fts f JOIN agent_sessions s ON s.id = f.session_id
       WHERE agent_sessions_fts MATCH ? AND (s.created_by IS NULL OR s.created_by = ?)
       ORDER BY rank LIMIT ?`,
    )
    .all(match, viewerId, limit) as ChatSearchHit[]
}

function writeIndex(sqlite: Database, sessionId: string): void {
  const session = sqlite.query('SELECT title FROM agent_sessions WHERE id = ?').get(sessionId) as {
    title: string
  } | null
  sqlite.query('DELETE FROM agent_sessions_fts WHERE session_id = ?').run(sessionId)
  if (!session) return
  const rows = sqlite
    .query('SELECT payload FROM agent_turns WHERE session_id = ? ORDER BY seq')
    .all(sessionId) as { payload: string }[]
  const parts: string[] = []
  for (const { payload } of rows) {
    const update = JSON.parse(payload) as AgentUpdate
    if (update.kind === 'user_message') parts.push(`\n${update.text}\n`)
    else if (update.kind === 'message_chunk') parts.push(update.text)
  }
  sqlite
    .query('INSERT INTO agent_sessions_fts (session_id, title, body) VALUES (?, ?, ?)')
    .run(sessionId, session.title, parts.join('').trim())
}
