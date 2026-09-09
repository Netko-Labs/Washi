import type { InkQuery } from '@washi/ink'
import { useState } from 'react'
import { useData } from '../data'
import { styled, useBind } from '../lib'
import type { ActionRef, BlockProps, Row } from '../lib/types'
import { usePaperHost } from '../provider'
import { useRow, useSheetState } from '../state'
import { Bound, cell } from './states'

type FieldKind = 'text' | 'number' | 'date' | 'select' | 'boolean'

/** One primitive over every column type. Label, help and error are structural. */
export function Field({
  field,
  kind,
  label,
  help,
  table,
  row,
  ...rest
}: BlockProps & {
  field: string
  kind: FieldKind
  label?: string
  help?: string
  table?: string
  row?: string
}) {
  const host = usePaperHost()
  const { refresh } = useData()
  const scoped = useRow()
  const rowId = row ?? (scoped?.id as string | undefined)
  const initial = scoped?.[field] ?? null
  const [value, setValue] = useState<string>(initial === null ? '' : String(initial))
  const [error, setError] = useState<string | null>(null)
  const id = `wsx-field-${field}-${rowId ?? 'new'}`

  const commit = async (next: string | number | boolean) => {
    if (!table || !rowId) return setError('this field is not bound to a row')
    try {
      await host.runAction({ verb: 'table.update', table, row: rowId, set: { [field]: next } })
      setError(null)
      refresh()
    } catch (cause) {
      setError(String(cause))
    }
  }

  const input =
    kind === 'boolean' ? (
      <input
        id={id}
        type="checkbox"
        checked={value === 'true'}
        onChange={(event) => {
          setValue(String(event.target.checked))
          void commit(event.target.checked)
        }}
      />
    ) : (
      <input
        id={id}
        className="wsx-field-input"
        type={kind === 'number' ? 'number' : kind === 'date' ? 'date' : 'text'}
        value={value}
        onChange={(event) => setValue(event.target.value)}
        onBlur={() => void commit(kind === 'number' ? Number(value) : value)}
      />
    )

  return (
    <div {...styled(rest, 'wsx-field')} data-kind={kind}>
      {label && (
        <label className="wsx-field-label" htmlFor={id}>
          {label}
        </label>
      )}
      {input}
      {help && !error && <div className="wsx-field-help">{help}</div>}
      {error && <div className="wsx-field-error">{error}</div>}
    </div>
  )
}

export function Board({
  bind,
  groupBy,
  title = 'title',
  empty,
  ...rest
}: BlockProps & {
  bind: InkQuery
  groupBy: string
  title?: string
  onAdd?: ActionRef
  empty?: string
}) {
  const state = useBind(bind)
  return (
    <Bound state={state} empty={empty}>
      {(rows) => {
        const groups = new Map<string, Row[]>()
        for (const row of rows) {
          const key = String(row[groupBy] ?? '—')
          groups.set(key, [...(groups.get(key) ?? []), row])
        }
        return (
          <div {...styled(rest, 'wsx-board')}>
            {[...groups.entries()].map(([group, items]) => (
              <div key={group} className="wsx-board-col">
                <div className="wsx-board-head">
                  <span>{group}</span>
                  <span>{items.length}</span>
                </div>
                {items.map((row) => (
                  <div key={String(row.id)} className="wsx-board-card">
                    {cell(row[title] ?? row.id)}
                  </div>
                ))}
              </div>
            ))}
          </div>
        )
      }}
    </Bound>
  )
}

export function Button({ action, children, ...rest }: BlockProps & { action: ActionRef }) {
  const host = usePaperHost()
  const { refresh } = useData()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      {...styled({ tone: 'accent', ...rest }, 'wsx-button')}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await host.runAction(action)
          refresh()
        } finally {
          setBusy(false)
        }
      }}
    >
      {children}
    </button>
  )
}

export function Task({
  row,
  done,
  children,
  ...rest
}: BlockProps & { row?: string; done?: boolean }) {
  const host = usePaperHost()
  const scoped = useRow()
  const rowId = row ?? (scoped?.id as string | undefined)
  const [checked, setChecked] = useState(done ?? scoped?.done === true)
  return (
    <label {...styled(rest, 'wsx-task')} data-done={checked || undefined}>
      <input
        type="checkbox"
        checked={checked}
        disabled={!rowId}
        onChange={async (event) => {
          setChecked(event.target.checked)
          if (rowId) await host.toggleTask(rowId, event.target.checked)
        }}
      />
      <span>{children}</span>
    </label>
  )
}

export function Switch({ state, label, ...rest }: BlockProps & { state: string; label?: string }) {
  const sheet = useSheetState()
  const on = sheet.values[state] === true
  return (
    <label {...styled(rest, 'wsx-switch-row')}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="wsx-switch"
        onClick={() => sheet.set(state, !on)}
      >
        <i />
      </button>
      {label}
    </label>
  )
}

export function Slider({
  state,
  min = 0,
  max = 100,
  step = 1,
  label,
  ...rest
}: BlockProps & { state: string; min?: number; max?: number; step?: number; label?: string }) {
  const sheet = useSheetState()
  const value = typeof sheet.values[state] === 'number' ? (sheet.values[state] as number) : min
  return (
    <label {...styled(rest, 'wsx-slider')}>
      <span className="wsx-slider-head">
        <span>{label ?? state}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => sheet.set(state, Number(event.target.value))}
      />
    </label>
  )
}
