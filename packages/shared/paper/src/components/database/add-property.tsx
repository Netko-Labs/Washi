import { useState } from 'react'
import { type AddPropertyProps, type ColumnSpec, columnKey, PROPERTY_TYPES } from './lib'

const BLANK = { label: '', type: 'text' as ColumnSpec['type'], options: '' }

/** The header's "+": a name, a type, and options when the type has them. */
export function AddProperty({ onAdd }: AddPropertyProps) {
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState(BLANK)
  const needsOptions = form.type === 'select' || form.type === 'multi_select'

  if (!open) {
    return (
      <button
        type="button"
        className="wsx-db-plus"
        aria-label="Add a property"
        onClick={() => setOpen(true)}
      >
        +
      </button>
    )
  }

  const submit = async () => {
    const options = form.options
      .split(',')
      .map((each) => each.trim())
      .filter(Boolean)
    if (!form.label.trim() || (needsOptions && options.length === 0)) return
    await onAdd(columnKey(form.label), form.type, options)
    setForm(BLANK)
    setOpen(false)
  }

  return (
    <form
      className="wsx-db-property"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
      onKeyDown={(event) => event.key === 'Escape' && setOpen(false)}
    >
      <input
        // biome-ignore lint/a11y/noAutofocus: the form opens because the person asked for it
        autoFocus
        className="wsx-db-input"
        placeholder="Property name"
        value={form.label}
        onChange={(event) => setForm({ ...form, label: event.currentTarget.value })}
      />
      <select
        className="wsx-db-input"
        aria-label="Property type"
        value={form.type}
        onChange={(event) =>
          setForm({ ...form, type: event.currentTarget.value as ColumnSpec['type'] })
        }
      >
        {PROPERTY_TYPES.map(({ type, label }) => (
          <option key={type} value={type}>
            {label}
          </option>
        ))}
      </select>
      {needsOptions && (
        <input
          className="wsx-db-input"
          placeholder="Options, comma-separated"
          value={form.options}
          onChange={(event) => setForm({ ...form, options: event.currentTarget.value })}
        />
      )}
      <button type="submit" className="wsx-db-button">
        Add
      </button>
    </form>
  )
}
