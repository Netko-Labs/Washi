import type { RowSearchHit } from '@washi/domain'
import { type ColumnType, type TableSpec, tableSpecSchema } from '@washi/ink'
import type { Workspace } from './client'
import type { RecordCandidate, WordyCell } from './types'

/** Columns whose cells are words a person typed or picked. */
const WORDY: ReadonlySet<ColumnType> = new Set(['text', 'url', 'select', 'status', 'multi_select'])
/** Rows the LIKE pass hands over to be read properly; past it, the newest win. */
const CANDIDATE_CAP = 2000
/** Characters kept on each side of a match. */
const SNIPPET_SIDE = 40
const MAX_TOKENS = 8

const escapeLike = (token: string) => token.replace(/[\\%_]/g, (char) => `\\${char}`)

/**
 * A token the LIKE pass may look for in a row's JSON: printable ASCII (the only case SQLite's LIKE
 * folds) with nothing JSON escapes, so it reads there as it was typed.
 */
const likeable = (token: string) =>
  [...token].every((char) => char >= ' ' && char <= '~' && char !== '"' && char !== '\\')

/** A cell as the words it shows: a list joined, anything else not words. */
function wordsOf(cell: unknown): string | null {
  if (typeof cell === 'string') return cell
  if (Array.isArray(cell)) {
    const words = cell.filter((each): each is string => typeof each === 'string')
    return words.length ? words.join(', ') : null
  }
  return null
}

function snippetOf(words: string, at: number, length: number): string {
  const start = Math.max(0, at - SNIPPET_SIDE)
  const end = Math.min(words.length, at + length + SNIPPET_SIDE)
  return `${start > 0 ? '…' : ''}${words.slice(start, end)}${end < words.length ? '…' : ''}`
}

/**
 * Rows of live tables whose words hold every token of `term`, case-blind (D140): the newest first,
 * at most `limit`. A LIKE pass over each row's JSON narrows the rows (ASCII tokens only — SQLite's
 * LIKE folds no other case), then each candidate's wordy cells are read for real, so a key or an
 * id never matches. Workspaces hold thousands of rows, not millions: a scan stays cheap and needs
 * no index kept in step with every write (P1 is untouched). Deleted rows and trashed tables
 * (D109) never match.
 */
export function searchRecords(ws: Workspace, term: string, limit = 20): RowSearchHit[] {
  const tokens = term.toLowerCase().split(/\s+/).filter(Boolean).slice(0, MAX_TOKENS)
  if (!tokens.length) return []
  const ascii = tokens.filter(likeable)
  const candidates = ws.sqlite
    .query(
      `SELECT r.id, r.data, t.name, t.spec FROM records r
       JOIN user_tables t ON t.id = r.table_id AND t.deleted_at IS NULL
       WHERE r.deleted_at IS NULL${ascii.map(() => " AND r.data LIKE ? ESCAPE '\\'").join('')}
       ORDER BY r.hlc_updated DESC LIMIT ?`,
    )
    .all(...ascii.map((token) => `%${escapeLike(token)}%`), CANDIDATE_CAP) as RecordCandidate[]
  const specs = new Map<string, TableSpec>()
  const hits: RowSearchHit[] = []
  for (const row of candidates) {
    if (hits.length >= limit) break
    const spec = specs.get(row.name) ?? tableSpecSchema.parse(JSON.parse(row.spec))
    specs.set(row.name, spec)
    const data = JSON.parse(row.data) as Record<string, unknown>
    const cells = spec.columns
      .filter((column) => WORDY.has(column.type))
      .map((column) => ({ column: column.name, words: wordsOf(data[column.name]) }))
      .filter((cell): cell is WordyCell => Boolean(cell.words))
    const all = cells.map((cell) => cell.words.toLowerCase()).join('\n')
    if (!tokens.every((token) => all.includes(token))) continue
    const [first = ''] = tokens
    const found = cells.find((cell) => cell.words.toLowerCase().includes(first))
    if (!found) continue
    const titleColumn = spec.columns.find((column) => column.type === 'text')
    hits.push({
      table: row.name,
      recordId: row.id,
      title: titleColumn ? (wordsOf(data[titleColumn.name]) ?? '') : '',
      column: found.column,
      snippet: snippetOf(found.words, found.words.toLowerCase().indexOf(first), first.length),
    })
  }
  return hits
}
