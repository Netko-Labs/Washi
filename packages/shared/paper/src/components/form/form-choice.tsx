import { type FormChoiceProps, type FormInputProps, fieldAria } from './lib'

/** Select, status and person: one choice, or none. */
export function FormChoice({ id, value, onChange, choices, required, error }: FormChoiceProps) {
  const current = typeof value === 'string' ? value : ''
  return (
    <select
      id={id}
      {...fieldAria(id, required, error)}
      className="wsx-field-input"
      value={current}
      onChange={(event) => onChange(event.currentTarget.value || null)}
    >
      <option value="">—</option>
      {current && !choices.some((choice) => choice.value === current) && (
        <option value={current}>{current}</option>
      )}
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  )
}

export function FormCheck({ id, value, onChange, required, error }: FormInputProps) {
  return (
    <input
      id={id}
      {...fieldAria(id, required, error)}
      type="checkbox"
      className="wsx-form-check"
      checked={value === true}
      onChange={(event) => onChange(event.currentTarget.checked)}
    />
  )
}
