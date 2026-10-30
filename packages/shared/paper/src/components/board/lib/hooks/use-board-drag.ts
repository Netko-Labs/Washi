import { type DragEvent, useEffect, useRef, useState } from 'react'
import { useData } from '../../../../data'
import type { Row } from '../../../../lib/types'
import { usePaperHost } from '../../../../provider'
import type { BindQuery } from '../../../../registry'
import type { BoardDrag, BoardLayout, DragState, Move } from '../types'
import { boardColumns, cardBelow, groupKeyOf, naturalBefore, rankPatches } from '../utils'
import { useSlide } from './use-slide'

/**
 * Native drag and drop over the columns. The column decides where a card lands from the pointer,
 * a slot the card's height opens there, and every card slides out of its way. A drop is one
 * `table.reorder`: the group column plus a fractional rank.
 */
export function useBoardDrag(bind: BindQuery, rows: Row[], layout: BoardLayout): BoardDrag {
  const host = usePaperHost()
  const { refresh } = useData()
  const [moves, setMoves] = useState<Record<string, Move>>({})
  const [drag, setDrag] = useState<DragState | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const latestRows = useRef(rows)
  const pending = useRef<ReturnType<typeof setTimeout> | null>(null)
  useEffect(() => {
    latestRows.current = rows
  }, [rows])
  useSlide(boardRef)

  const { groupBy, rank, groups, options } = layout
  const columns = boardColumns(rows, moves, groupBy, rank, groups, options)

  const start = (id: string, event: DragEvent<HTMLElement>) => {
    event.dataTransfer.effectAllowed = 'move'
    event.dataTransfer.setData('text/plain', id)
    const slotHeight = event.currentTarget.offsetHeight
    const column = columns.find((entry) => entry.items.some((row) => row.id === id))
    const index = column?.items.findIndex((row) => row.id === id) ?? -1
    const next = column?.items[index + 1]
    const target = { group: column?.name ?? '', before: next ? String(next.id) : null }
    // The browser snapshots the drag image after this handler; hide the card only once it has.
    pending.current = setTimeout(() => setDrag({ id, target, slotHeight }), 0)
  }

  const end = () => {
    if (pending.current) clearTimeout(pending.current)
    setDrag(null)
  }

  const over = (group: string, event: DragEvent<HTMLElement>) => {
    if (!drag) return
    event.preventDefault()
    event.dataTransfer.dropEffect = 'move'
    const items = columns.find((column) => column.name === group)?.items ?? []
    const before = rank
      ? cardBelow(event.currentTarget, event.clientY, drag.id)
      : naturalBefore(rows, items, drag.id)
    if (drag.target.group !== group || drag.target.before !== before) {
      setDrag({ ...drag, target: { group, before } })
    }
  }

  const drop = (event: DragEvent<HTMLElement>) => {
    if (!drag) return
    event.preventDefault()
    const { id, target } = drag
    setDrag(null)
    const items = columns.find((column) => column.name === target.group)?.items ?? []
    const others = items.filter((row) => row.id !== id)
    const at =
      target.before === null ? others.length : others.findIndex((row) => row.id === target.before)
    const dragged = rows.find((row) => row.id === id)
    if (!dragged) return
    const order = [...others.slice(0, at), dragged, ...others.slice(at)]
    // No rank column (rank=""): a drop moves the card between groups and keeps no order.
    const patches = rank ? rankPatches(order, id, rank) : [{ id, rank: 0 }]
    const groupOf = (row: string) => {
      const entry = rows.find((each) => each.id === row)
      return row === id || !entry ? target.group : groupKeyOf(entry, groupBy)
    }
    // "No status" is written as an empty cell, never an empty string.
    const valueOf = (row: string) => groupOf(row) || null

    setMoves((current) => {
      const live = Object.entries(current).filter(
        ([, move]) => move.against === null || move.against === rows,
      )
      const next = Object.fromEntries(live)
      for (const patch of patches) {
        next[patch.id] = { group: groupOf(patch.id), rank: patch.rank, against: null }
      }
      return next
    })
    const writes = patches.map((patch) =>
      host.runAction({
        verb: 'table.reorder',
        table: bind.table,
        row: patch.id,
        set: rank
          ? { [groupBy]: valueOf(patch.id), [rank]: patch.rank }
          : { [groupBy]: valueOf(patch.id) },
      }),
    )
    const ids = patches.map((patch) => patch.id)
    void Promise.all(writes)
      .then(
        () =>
          setMoves((current) => {
            const next = { ...current }
            for (const row of ids) {
              const move = next[row]
              if (move) next[row] = { ...move, against: latestRows.current }
            }
            return next
          }),
        (cause: unknown) => {
          setMoves((current) =>
            Object.fromEntries(Object.entries(current).filter(([row]) => !ids.includes(row))),
          )
          throw cause
        },
      )
      .finally(refresh)
  }

  return {
    boardRef,
    columns,
    dragging: drag?.id ?? null,
    target: drag?.target ?? null,
    slotHeight: drag?.slotHeight ?? 0,
    start,
    end,
    over,
    drop,
  }
}
