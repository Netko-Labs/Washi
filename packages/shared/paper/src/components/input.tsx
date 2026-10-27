import { useState } from 'react'
import { useData } from '../data'
import { resolveArgs, styled, useRunAction, useSelectOptions } from '../lib'
import type { ActionRef, BlockProps } from '../lib/types'
import { usePaperHost } from '../provider'
import { useRow, useSheetState } from '../state'

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

  const options = useSelectOptions(kind === 'select' ? table : undefined, field)

  const input =
    kind === 'select' ? (
      <select
        id={id}
        className="wsx-field-input"
        value={value}
        onChange={(event) => {
          setValue(event.target.value)
          void commit(event.target.value)
        }}
      >
        {!options.includes(value) && <option value={value}>{value || '—'}</option>}
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    ) : kind === 'boolean' ? (
      <input
        id={id}
        type="checkbox"
        className="wsx-form-check"
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

export function Button({ action, children, ...rest }: BlockProps & { action: ActionRef }) {
  const run = useRunAction()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      {...styled({ tone: 'accent', ...rest }, 'wsx-button')}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await run(action)
        } finally {
          setBusy(false)
        }
      }}
    >
      {children}
    </button>
  )
}

/** A text box that runs one verb with `$value` and `$now` filled in — the comment box. */
export function Compose({
  action,
  label,
  placeholder,
  multiline,
  ...rest
}: BlockProps & { action: ActionRef; label?: string; placeholder?: string; multiline?: boolean }) {
  const run = useRunAction()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    const value = text.trim()
    if (!value) return
    setBusy(true)
    try {
      const args: Record<string, string> = {}
      args.$value = value
      args.$now = new Date().toISOString()
      await run(resolveArgs(action as never, args) as never)
      setText('')
    } finally {
      setBusy(false)
    }
  }
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div {...styled(rest, 'wsx-compose')}>
      <Input
        className="wsx-field-input"
        placeholder={placeholder}
        value={text}
        rows={multiline ? 3 : undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !multiline) {
            event.preventDefault()
            void submit()
          }
        }}
      />
      <button
        type="button"
        className="wsx-button"
        data-tone="accent"
        data-size="sm"
        disabled={busy || !text.trim()}
        onClick={() => void submit()}
      >
        {label ?? 'Post'}
      </button>
    </div>
  )
}

export function Task({
  row,
  done,
  field,
  children,
  ...rest
}: BlockProps & { row?: string; done?: boolean; field?: string }) {
  const host = usePaperHost()
  const scoped = useRow()
  const rowId = row ?? (scoped?.id as string | undefined)
  const [checked, setChecked] = useState(done ?? scoped?.[field ?? 'done'] === true)
  return (
    <label
      {...styled(rest, 'wsx-task')}
      data-done={checked || undefined}
      data-toggle={field ? '' : undefined}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={!rowId}
        onChange={async (event) => {
          setChecked(event.target.checked)
          if (rowId) await host.toggleTask(rowId, event.target.checked, field)
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
