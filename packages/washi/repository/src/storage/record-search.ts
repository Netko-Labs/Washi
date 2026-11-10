import type { RowSearchHit } from '@washi/domain'
import { type ColumnType, type TableSpec, tableSpecSchema } from '@washi/ink'
import type { Workspace } from './client'
import type { RecordCandidate, TextMatch, WordyCell } from './types'

/** Columns whose cells are words a person typed or picked. */
const WORDY: ReadonlySet<ColumnType> = new Set(['text', 'url', 'select', 'status', 'multi_select'])
/** Rows the LIKE pass hands over to be read properly, a page at a time, newest first. */
const CANDIDATE_PAGE = 2000
/** The most rows one search reads, however many pages that takes. */
const SCAN_CAP = 50_000
/** Characters kept on each side of a match. */
const SNIPPET_SIDE = 40
/** The most different words one search takes: past it the search is refused in words. */
const MAX_WORDS = 32
/** Words the LIKE pass narrows by; every word of a term still has to match when rows are read. */
const LIKE_TOKENS = 8

const escapeLike = (token: string) => token.replace(/[\\%_]/g, (char) => `\\${char}`)

/**
 * A token the LIKE pass may look for in a row's JSON: printable ASCII (the only case SQLite's LIKE
 * folds) with nothing JSON escapes, so it reads there as it was typed. Any other token narrows
 * nothing here; the read of each page finds it, case-blind, so no row is missed for it.
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

/** Where a token sits in a cell as written, case-blind, measured on the cell itself. */
function matchIn(words: string, token: string): TextMatch {
  const found = new RegExp(token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'iu').exec(words)
  return found ? { at: found.index, length: found[0].length } : { at: 0, length: 0 }
}

function snippetOf(words: string, { at, length }: TextMatch): string {
  const start = Math.max(0, at - SNIPPET_SIDE)
  const end = Math.min(words.length, at + length + SNIPPET_SIDE)
  return `${start > 0 ? '…' : ''}${words.slice(start, end)}${end < words.length ? '…' : ''}`
}

/**
 * Rows of live tables whose words hold every token of `term`, case-blind (D140): the newest first,
 * at most `limit`. A LIKE pass over each row's JSON narrows the rows (ASCII tokens only — SQLite's
 * LIKE folds no other case), then each candidate's wordy cells are read for real, so a key or an
 * id never matches. Candidates come a page at a time until `limit` is met or `SCAN_CAP` rows are
 * read, so a word the LIKE pass cannot narrow (München) still reaches older rows. Workspaces hold thousands of rows, not millions: a scan stays cheap and needs
 * no index kept in step with every write (P1 is untouched). Deleted rows and trashed tables
 * (D109) never match.
 */
export function searchRecords(ws: Workspace, term: string, limit = 20): RowSearchHit[] {
  const tokens = [...new Set(term.toLowerCase().split(/\s+/).filter(Boolean))]
  if (tokens.length > MAX_WORDS) {
    throw new Error(
      `a search takes up to ${MAX_WORDS} different words — this one has ${tokens.length}`,
    )
  }
  if (!tokens.length) return []
  const narrowing = tokens.filter(likeable).slice(0, LIKE_TOKENS)
  const query = ws.sqlite.query(
    `SELECT r.id, r.data, t.name, t.spec FROM records r
     JOIN user_tables t ON t.id = r.table_id AND t.deleted_at IS NULL
     WHERE r.deleted_at IS NULL${narrowing.map(() => " AND r.data LIKE ? ESCAPE '\\'").join('')}
     ORDER BY r.hlc_updated DESC, r.id LIMIT ? OFFSET ?`,
  )
  const likes = narrowing.map((token) => `%${escapeLike(token)}%`)
  const specs = new Map<string, TableSpec>()
  const hits: RowSearchHit[] = []
  for (let offset = 0; offset < SCAN_CAP && hits.length < limit; offset += CANDIDATE_PAGE) {
    const page = query.all(...likes, CANDIDATE_PAGE, offset) as RecordCandidate[]
    readPage(page, tokens, specs, hits, limit)
    if (page.length < CANDIDATE_PAGE) break
  }
  return hits
}

/** One page of candidates read for real: each row whose wordy cells hold every token is a hit. */
function readPage(
  page: RecordCandidate[],
  tokens: string[],
  specs: Map<string, TableSpec>,
  hits: RowSearchHit[],
  limit: number,
): void {
  for (const row of page) {
    if (hits.length >= limit) return
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
      snippet: snippetOf(found.words, matchIn(found.words, first)),
    })
  }
}
