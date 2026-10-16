import type { InkQuery } from '@washi/ink'
import { type CSSProperties, type DragEvent, useState } from 'react'
import { useData } from '../data'
import { columnOf, resolveRowDeep, styled, useBind, useRunAction } from '../lib'
import type { ActionRef, BlockProps, Row, Tone } from '../lib/types'
import { usePaperHost } from '../provider'
import { Avatar, Badge } from './data'
import { Bound, cell } from './states'

interface Move {
  group: string
  rank: number
}

interface DropTarget {
  group: string
  before: string | null
}

function rankOf(row: Row, rank: string): number {
  return typeof row[rank] === 'number' ? (row[rank] as number) : 0
}

/** Fractional rank between the neighbours, so two people dragging at once converge. */
function rankBetween(items: Row[], before: string | null, rank: string): number {
  const index = before === null ? items.length : items.findIndex((row) => row.id === before)
  const prev = items[index - 1]
  const next = items[index]
  if (!prev && !next) return 1
  if (!prev) return rankOf(next as Row, rank) - 1
  if (!next) return rankOf(prev, rank) + 1
  return (rankOf(prev, rank) + rankOf(next, rank)) / 2
}

/** Badge values that carry meaning get the tone for it; anything else stays neutral. */
const BADGE_TONES: Record<string, Tone> = {
  highest: 'danger',
  high: 'danger',
  medium: 'warning',
  low: 'neutral',
  bug: 'danger',
  story: 'success',
  task: 'info',
  epic: 'accent',
  blocked: 'danger',
}

/** Count, plus the column total when `meta` is numeric — the Jira points-per-column read. */
function headCount(items: Row[], meta: string | undefined): string {
  if (!meta || !items.some((row) => typeof row[meta] === 'number')) return String(items.length)
  const total = items.reduce(
    (sum, row) => sum + (typeof row[meta] === 'number' ? (row[meta] as number) : 0),
    0,
  )
  return `${items.length} · ${total} pts`
}

function substitute(action: ActionRef, group: string): ActionRef {
  return JSON.parse(JSON.stringify(action).replaceAll('$group', group)) as ActionRef
}

/** Grouped, draggable records. A drop is one `table.reorder`: the group column plus a fractional rank. */
export function Board({
  bind,
  groupBy,
  groups,
  rank = 'rank',
  title,
  kicker,
  badge,
  meta,
  avatar,
  onAdd,
  onOpen,
  empty,
  ...rest
}: BlockProps & {
  bind: InkQuery
  groupBy: string
  groups?: string[]
  rank?: string
  title?: string
  kicker?: string
  badge?: string
  meta?: string
  avatar?: string
  onAdd?: ActionRef
  onOpen?: ActionRef
  empty?: string
}) {
  const host = usePaperHost()
  const { refresh } = useData()
  const run = useRunAction()
  const state = useBind(bind)
  const [moves, setMoves] = useState<Record<string, Move>>({})
  const [dragging, setDragging] = useState<string | null>(null)
  const [target, setTarget] = useState<DropTarget | null>(null)

  const columns = (rows: Row[]) => {
    const merged = rows.map((row) => {
      const move = moves[String(row.id)]
      return move ? { ...row, [groupBy]: move.group, [rank]: move.rank } : row
    })
    const names = groups ?? [...new Set(merged.map((row) => String(row[groupBy] ?? '—')))]
    return names.map((name) => ({
      name,
      items: merged
        .filter((row) => String(row[groupBy] ?? '—') === name)
        .sort((a, b) => rankOf(a, rank) - rankOf(b, rank)),
    }))
  }

  const drop = async (rows: Row[], to: DropTarget) => {
    const id = dragging
    setDragging(null)
    setTarget(null)
    if (!id) return
    const items = columns(rows).find((column) => column.name === to.group)?.items ?? []
    const nextRank = rankBetween(
      items.filter((row) => row.id !== id),
      to.before === id ? null : to.before,
      rank,
    )
    setMoves((current) => ({ ...current, [id]: { group: to.group, rank: nextRank } }))
    try {
      await host.runAction({
        verb: 'table.reorder',
        table: bind.table,
        row: id,
        // No rank column (rank=""): a drop moves the card between groups and keeps no order.
        set: rank ? { [groupBy]: to.group, [rank]: nextRank } : { [groupBy]: to.group },
      })
    } finally {
      setMoves((current) => {
        const { [id]: _, ...others } = current
        return others
      })
      refresh()
    }
  }

  const openable = Boolean(onOpen ?? host.openRow)
  const open = (row: Row) => {
    if (onOpen) void run(resolveRowDeep(onOpen as never, row) as never)
    else if (typeof row.id === 'string') host.openRow?.(row.id)
  }

  const shown = (value: Row[string] | undefined) =>
    typeof value === 'number' ? value.toLocaleString(host.locale) : cell(value)

  const over = (event: DragEvent, next: DropTarget) => {
    if (!dragging) return
    event.preventDefault()
    if (target?.group !== next.group || target?.before !== next.before) setTarget(next)
  }

  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const titleKey = title ?? columnOf(rows, 'string', ['title', 'name']) ?? 'id'
        return (
          <div {...styled(rest, 'wsx-board')}>
            {columns(rows).map(({ name, items }, index) => (
              <section
                key={name}
                aria-label={name}
                className="wsx-board-col"
                data-hot={target?.group === name || undefined}
                style={{ '--col': `var(--chart-${(index % 5) + 1})` } as CSSProperties}
                onDragOver={(event) => over(event, { group: name, before: null })}
                onDrop={() => void drop(rows, { group: name, before: null })}
              >
                <div className="wsx-board-head">
                  <span className="wsx-board-head-name">
                    <i />
                    {name}
                  </span>
                  <span className="wsx-board-head-count">{headCount(items, meta)}</span>
                </div>
                {items.map((row) => {
                  const id = String(row.id)
                  return (
                    <article
                      key={id}
                      className="wsx-board-card"
                      draggable
                      data-dragging={dragging === id || undefined}
                      data-before={target?.group === name && target.before === id ? '' : undefined}
                      onDragStart={(event) => {
                        event.dataTransfer.effectAllowed = 'move'
                        setDragging(id)
                      }}
                      onDragEnd={() => {
                        setDragging(null)
                        setTarget(null)
                      }}
                      onDragOver={(event) => {
                        event.stopPropagation()
                        over(event, { group: name, before: id })
                      }}
                      onDrop={(event) => {
                        event.stopPropagation()
                        void drop(rows, { group: name, before: id })
                      }}
                      onClick={() => open(row)}
                      onKeyDown={(event) => event.key === 'Enter' && open(row)}
                      tabIndex={openable ? 0 : undefined}
                      data-openable={openable ? '' : undefined}
                    >
                      {kicker && <div className="wsx-board-card-kicker">{cell(row[kicker])}</div>}
                      <div className="wsx-board-card-title">
                        {cell(row[titleKey]) || 'Untitled'}
                      </div>
                      {(badge || meta || avatar) && (
                        <div className="wsx-board-card-meta">
                          {badge && row[badge] !== null && row[badge] !== undefined && (
                            <Badge size="sm" tone={BADGE_TONES[String(row[badge]).toLowerCase()]}>
                              {shown(row[badge])}
                            </Badge>
                          )}
                          {meta && <span className="wsx-board-card-note">{shown(row[meta])}</span>}
                          {avatar && typeof row[avatar] === 'string' && row[avatar] && (
                            <Avatar label={row[avatar] as string} size="sm" />
                          )}
                        </div>
                      )}
                    </article>
                  )
                })}
                {items.length === 0 && <div className="wsx-board-drop">Drop here</div>}
                {onAdd && (
                  <button
                    type="button"
                    className="wsx-board-add"
                    onClick={() => void run(substitute(onAdd, name))}
                  >
                    + Add card
                  </button>
                )}
              </section>
            ))}
          </div>
        )
      }}
    </Bound>
  )
}
