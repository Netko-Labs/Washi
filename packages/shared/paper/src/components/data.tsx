import type { InkQuery, QueryRow } from '@washi/ink'
import { type ReactNode, useEffect, useState } from 'react'
import { cn, TOUCH_TARGET } from '../lib'
import { usePaperHost } from '../provider'

function useBind(query: InkQuery | undefined): { rows: QueryRow[]; error: string | null } {
  const host = usePaperHost()
  const [rows, setRows] = useState<QueryRow[]>([])
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!query) return
    let alive = true
    host
      .runQuery(query)
      .then((result) => alive && setRows(result.rows))
      .catch((cause: unknown) => alive && setError(String(cause)))
    return () => {
      alive = false
    }
  }, [host, JSON.stringify(query)])

  return { rows, error }
}

export function Task({
  done = false,
  record,
  className,
  children,
}: {
  done?: boolean
  record?: string
  className?: string
  children?: ReactNode
}) {
  const host = usePaperHost()
  const [checked, setChecked] = useState(done)

  return (
    <label className={cn('flex items-center gap-2', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!record}
        onChange={async (event) => {
          const next = event.target.checked
          setChecked(next)
          if (record) await host.toggleTask(record, next)
        }}
        className={cn('size-4 shrink-0 accent-primary', TOUCH_TARGET)}
      />
      <span className={checked ? 'text-muted-foreground line-through' : ''}>{children}</span>
    </label>
  )
}

export function TaskList({
  bind,
  className,
  children,
}: {
  bind?: InkQuery
  className?: string
  children?: ReactNode
}) {
  const { rows, error } = useBind(bind)

  return (
    <div className={className}>
      {children}
      {error && <div className="text-destructive">{error}</div>}
      {bind &&
        rows.map((row) => (
          <Task key={String(row.id)} record={String(row.id)} done={row.done === true}>
            {String(row.title ?? row.id)}
          </Task>
        ))}
    </div>
  )
}

export function Table({
  bind,
  columns,
  className,
}: {
  bind: InkQuery
  columns?: string[]
  className?: string
}) {
  const { rows, error } = useBind(bind)
  if (error) return <div className="text-destructive">{error}</div>

  const keys = columns ?? Object.keys(rows[0] ?? {}).filter((key) => key !== 'id')

  return (
    <div className={cn('overflow-x-auto', className)}>
      <table className="w-full">
        <thead>
          <tr>
            {keys.map((key) => (
              <th key={key} className="text-left">
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)}>
              {keys.map((key) => (
                <td key={key}>
                  {row[key] === null || row[key] === undefined ? '' : String(row[key])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td colSpan={Math.max(keys.length, 1)}>no rows</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}

export function Board({
  bind,
  groupBy,
  className,
}: {
  bind: InkQuery
  groupBy: string
  className?: string
}) {
  const { rows, error } = useBind(bind)
  if (error) return <div className="text-destructive">{error}</div>

  const groups = new Map<string, QueryRow[]>()
  for (const row of rows) {
    const key = String(row[groupBy] ?? '—')
    const bucket = groups.get(key) ?? []
    bucket.push(row)
    groups.set(key, bucket)
  }

  return (
    <div className={cn('flex gap-3 overflow-x-auto', className)}>
      {[...groups.entries()].map(([group, items]) => (
        <div key={group} className="min-w-40 flex-1 basis-56">
          <div>
            {group} · {items.length}
          </div>
          {items.map((row) => (
            <div key={String(row.id)}>{String(row.title ?? row.id)}</div>
          ))}
        </div>
      ))}
      {groups.size === 0 && <div>no rows</div>}
    </div>
  )
}
