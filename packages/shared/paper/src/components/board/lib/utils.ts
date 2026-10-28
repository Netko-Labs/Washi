import type { ActionRef, Row } from '../../../lib/types'
import { VALUE_TONES } from '../../../lib/values'
import type { BoardColumn, Move, RankPatch } from './types'

export function rankOf(row: Row, rank: string): number {
  return typeof row[rank] === 'number' ? (row[rank] as number) : 0
}

/** Fractional rank between the neighbours, so two people dragging at once converge. */
export function rankBetween(items: Row[], before: string | null, rank: string): number {
  const index = before === null ? items.length : items.findIndex((row) => row.id === before)
  const prev = items[index - 1]
  const next = items[index]
  if (!prev && !next) return 1
  if (!prev) return rankOf(next as Row, rank) - 1
  if (!next) return rankOf(prev, rank) + 1
  return (rankOf(prev, rank) + rankOf(next, rank)) / 2
}

/** Count, plus the column total when `meta` is numeric — the Jira points-per-column read. */
export function headCount(items: Row[], meta: string | undefined): string {
  if (!meta || !items.some((row) => typeof row[meta] === 'number')) return String(items.length)
  const total = items.reduce(
    (sum, row) => sum + (typeof row[meta] === 'number' ? (row[meta] as number) : 0),
    0,
  )
  return `${items.length} · ${total} pts`
}

export function substitute(action: ActionRef, group: string): ActionRef {
  return JSON.parse(JSON.stringify(action).replaceAll('$group', group)) as ActionRef
}

/**
 * A move holds while its write is on its way and through the render it settled in; the rows
 * fetched after it replace it, so the card never snaps back to where it was.
 */
export function boardColumns(
  rows: Row[],
  moves: Record<string, Move>,
  groupBy: string,
  rank: string,
  groups: string[] | undefined,
): BoardColumn[] {
  const merged = rows.map((row) => {
    const move = moves[String(row.id)]
    const holds = move && (move.against === null || move.against === rows)
    if (!holds) return row
    return rank
      ? { ...row, [groupBy]: move.group, [rank]: move.rank }
      : { ...row, [groupBy]: move.group }
  })
  const names = groups ?? [...new Set(merged.map((row) => String(row[groupBy] ?? '—')))]
  return names.map((name) => ({
    name,
    items: merged
      .filter((row) => String(row[groupBy] ?? '—') === name)
      .sort((a, b) => rankOf(a, rank) - rankOf(b, rank)),
  }))
}

/** The card the pointer sits above, by layout midpoints — transforms in flight don't count. */
export function cardBelow(column: HTMLElement, clientY: number, skip: string | null) {
  const top = column.getBoundingClientRect().top
  for (const card of column.querySelectorAll<HTMLElement>('[data-card]')) {
    const id = card.dataset.card ?? null
    if (id === skip) continue
    if (clientY < top + card.offsetTop + card.offsetHeight / 2) return id
  }
  return null
}

/** The ranks a drop writes: one between its neighbours, or the whole column renumbered on a tie. */
export function rankPatches(order: Row[], id: string, rank: string): RankPatch[] {
  const index = order.findIndex((row) => row.id === id)
  const prev = order[index - 1]
  const next = order[index + 1]
  const others = order.filter((row) => row.id !== id)
  const between = rankBetween(others, next ? String(next.id) : null, rank)
  const fits = (!prev || rankOf(prev, rank) < between) && (!next || between < rankOf(next, rank))
  if (fits) return [{ id, rank: between }]
  return order
    .map((row, at) => ({ row, rank: at + 1 }))
    .filter(({ row, rank: value }) => row.id === id || row[rank] !== value)
    .map(({ row, rank: value }) => ({ id: String(row.id), rank: value }))
}

/** Where a card lands in an unordered board: its place in the rows as they come. */
export function naturalBefore(rows: Row[], column: Row[], id: string): string | null {
  const place = new Map(rows.map((row, index) => [row.id, index]))
  const at = place.get(id) ?? -1
  const next = column.find((row) => row.id !== id && (place.get(row.id) ?? -1) > at)
  return next ? String(next.id) : null
}

/** A column named for a meaning (done, blocked, in review) wears its tone; others take the ramp. */
export function columnHue(name: string, index: number): string {
  const tone = VALUE_TONES[name.toLowerCase()]
  if (tone === 'neutral') return 'var(--muted)'
  if (tone === 'accent') return 'var(--k-fill)'
  if (tone) return `var(--tone-${tone})`
  return `var(--chart-${(index % 5) + 1})`
}
