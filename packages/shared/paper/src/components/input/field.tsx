import { styled, useSelectOptions } from '../../lib'
import type { FieldProps } from '../../lib/types'
import { useField } from './lib'

/** One primitive over every column type. Label, help and error are structural. */
export function Field({ field, kind, label, help, table, row, ...rest }: FieldProps) {
  const { id, value, setValue, error, commit } = useField(field, table, row)
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
