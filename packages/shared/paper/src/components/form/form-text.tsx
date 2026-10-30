import { FORM_INPUT_TYPES, type FormInputProps, fieldAria } from './lib'

/** Text, number, date and URL: one line, so Enter adds the row. */
export function FormText({ id, column, value, onChange, required, error }: FormInputProps) {
  const shown = typeof value === 'string' || typeof value === 'number' ? String(value) : ''
  const numeric = column.type === 'number'
  return (
    <input
      id={id}
      {...fieldAria(id, required, error)}
      className="wsx-field-input"
      type={FORM_INPUT_TYPES[column.type] ?? 'text'}
      step={numeric ? 'any' : undefined}
      inputMode={numeric ? 'decimal' : undefined}
      value={column.type === 'date' ? shown.slice(0, 10) : shown}
      onChange={(event) => onChange(event.currentTarget.value)}
    />
  )
}
