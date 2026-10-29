import type { TableSpec } from '@washi/ink'
import { useEffect, useState } from 'react'
import { resolveRow, styled, useBind } from '../lib'
import type { DrawerProps, SchemaProps } from '../lib/types'
import { usePaperHost } from '../provider'
import { RowProvider, useSheetState } from '../state'
import { Bound, cell } from './states'

/**
 * A side panel whose openness is a state key. With `bind`, the key holds a row id
 * and children render with that row as `$row`; without, any truthy value opens it.
 */
export function Drawer({ state, bind, title, children, ...rest }: DrawerProps) {
  const sheet = useSheetState()
  const value = sheet.values[state]
  const open = value !== null && value !== undefined && value !== false && value !== ''
  const query =
    open && bind && typeof value === 'string'
      ? { ...bind, where: [{ column: 'id', op: 'eq' as const, value }], limit: 1 }
      : undefined
  const bound = useBind(query)
  const row = query ? bound.rows[0] : undefined
  const close = () => sheet.set(state, null)

  useEffect(() => {
    if (!open) return
    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && close()
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, state])

  if (!open) return null

  return (
    <div className="wsx-drawer-root">
      <button type="button" className="wsx-drawer-scrim" aria-label="Close" onClick={close} />
      <aside {...styled(rest, 'wsx-drawer')} role="dialog" aria-label={title ?? state}>
        <div className="wsx-drawer-head">
          <span className="wsx-drawer-title">{resolveRow(title ?? '', row, cell)}</span>
          <button type="button" className="wsx-drawer-close" aria-label="Close" onClick={close}>
            ×
          </button>
        </div>
        <div className="wsx-drawer-body">
          {query ? (
            <Bound state={bound} empty="That row is gone.">
              {(rows) => {
                const current = rows[0]
                return current ? <RowProvider row={current}>{children(current)}</RowProvider> : null
              }}
            </Bound>
          ) : (
            children(null)
          )}
        </div>
      </aside>
    </div>
  )
}

/** A table's columns from the spec: the schema the page is a view of. */
export function Schema({ table, ...rest }: SchemaProps) {
  const host = usePaperHost()
  const [spec, setSpec] = useState<TableSpec | null>(null)

  useEffect(() => {
    let alive = true
    host.describeTable(table).then((result) => alive && setSpec(result))
    return () => {
      alive = false
    }
  }, [host, table])

  return (
    <div {...styled(rest, 'wsx-table-wrap')}>
      <table className="wsx-table">
        <thead>
          <tr>
            <th>field</th>
            <th>type</th>
            <th>options</th>
          </tr>
        </thead>
        <tbody>
          {(spec?.columns ?? []).map((column) => (
            <tr key={column.name}>
              <td>{column.name}</td>
              <td>{column.type}</td>
              <td>{column.options?.join(' · ') ?? ''}</td>
            </tr>
          ))}
          {!spec && (
            <tr>
              <td colSpan={3}>{spec === null ? 'Loading…' : ''}</td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  )
}
