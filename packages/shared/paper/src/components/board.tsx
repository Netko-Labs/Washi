import type { InkQuery } from '@washi/ink'
import { type DragEvent, useState } from 'react'
import { useData } from '../data'
import { styled, useBind } from '../lib'
import type { ActionRef, BlockProps, Row } from '../lib/types'
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

function substitute(action: ActionRef, group: string): ActionRef {
  return JSON.parse(JSON.stringify(action).replaceAll('$group', group)) as ActionRef
}

/** Grouped, draggable records. A drop is one `table.reorder`: the group column plus a fractional rank. */
export function Board({
  bind,
  groupBy,
  groups,
  rank = 'rank',
  title = 'title',
  badge,
  meta,
  avatar,
  onAdd,
  empty,
  ...rest
}: BlockProps & {
  bind: InkQuery
  groupBy: string
  groups?: string[]
  rank?: string
  title?: string
  badge?: string
  meta?: string
  avatar?: string
  onAdd?: ActionRef
  empty?: string
}) {
  const host = usePaperHost()
  const { refresh } = useData()
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
        set: { [groupBy]: to.group, [rank]: nextRank },
      })
    } finally {
      setMoves((current) => {
        const { [id]: _, ...others } = current
        return others
      })
      refresh()
    }
  }

  const over = (event: DragEvent, next: DropTarget) => {
    if (!dragging) return
    event.preventDefault()
    if (target?.group !== next.group || target?.before !== next.before) setTarget(next)
  }

  return (
    <Bound state={state} empty={empty}>
      {(rows) => (
        <div {...styled(rest, 'wsx-board')}>
          {columns(rows).map(({ name, items }) => (
            <section
              key={name}
              aria-label={name}
              className="wsx-board-col"
              data-hot={target?.group === name || undefined}
              onDragOver={(event) => over(event, { group: name, before: null })}
              onDrop={() => void drop(rows, { group: name, before: null })}
            >
              <div className="wsx-board-head">
                <span>{name}</span>
                <span>{items.length}</span>
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
                  >
                    <div className="wsx-board-card-title">{cell(row[title] ?? row.id)}</div>
                    {(badge || meta || avatar) && (
                      <div className="wsx-board-card-meta">
                        {badge && row[badge] !== null && row[badge] !== undefined && (
                          <Badge size="sm">{cell(row[badge])}</Badge>
                        )}
                        {meta && <span className="wsx-board-card-note">{cell(row[meta])}</span>}
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
                  onClick={async () => {
                    await host.runAction(substitute(onAdd, name))
                    refresh()
                  }}
                >
                  + Add card
                </button>
              )}
            </section>
          ))}
        </div>
      )}
    </Bound>
  )
}
