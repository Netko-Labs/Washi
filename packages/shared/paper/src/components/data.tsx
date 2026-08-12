import type { InkQuery, QueryRow } from '@washi/ink'
import { type ReactNode, useEffect, useState } from 'react'
import { usePaperHost } from '../provider'

function cx(base: string, extra?: string): string {
  return extra ? `${base} ${extra}` : base
}

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
    <label className={cx('my-1 flex items-center gap-2 text-sm', className)}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!record}
        onChange={async (event) => {
          const next = event.target.checked
          setChecked(next)
          if (record) await host.toggleTask(record, next)
        }}
        className="size-4 accent-primary"
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
    <div className={cx('my-3', className)}>
      {children}
      {error && <div className="text-destructive text-sm">{error}</div>}
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
  if (error) return <div className="my-3 text-destructive text-sm">{error}</div>

  const keys = columns ?? Object.keys(rows[0] ?? {}).filter((key) => key !== 'id')

  return (
    <div className={cx('my-3 overflow-x-auto rounded-lg border border-border', className)}>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-border border-b bg-muted/60">
            {keys.map((key) => (
              <th
                key={key}
                className="px-3 py-2 text-left font-medium text-muted-foreground text-xs"
              >
                {key}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={String(row.id ?? index)} className="border-border border-b last:border-0">
              {keys.map((key) => (
                <td key={key} className="px-3 py-2">
                  {row[key] === null || row[key] === undefined ? '' : String(row[key])}
                </td>
              ))}
            </tr>
          ))}
          {rows.length === 0 && (
            <tr>
              <td
                colSpan={Math.max(keys.length, 1)}
                className="px-3 py-4 text-center text-muted-foreground"
              >
                no rows
              </td>
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
  if (error) return <div className="my-3 text-destructive text-sm">{error}</div>

  const groups = new Map<string, QueryRow[]>()
  for (const row of rows) {
    const key = String(row[groupBy] ?? '—')
    const bucket = groups.get(key) ?? []
    bucket.push(row)
    groups.set(key, bucket)
  }

  return (
    <div className={cx('my-3 flex gap-3 overflow-x-auto', className)}>
      {[...groups.entries()].map(([group, items]) => (
        <div key={group} className="w-64 shrink-0 rounded-lg border border-border bg-muted/40 p-2">
          <div className="mb-2 px-1 font-medium text-muted-foreground text-xs uppercase">
            {group} · {items.length}
          </div>
          {items.map((row) => (
            <div
              key={String(row.id)}
              className="mb-2 rounded-md border border-border bg-card p-2 text-sm"
            >
              {String(row.title ?? row.id)}
            </div>
          ))}
        </div>
      ))}
      {groups.size === 0 && <div className="text-muted-foreground text-sm">no rows</div>}
    </div>
  )
}
