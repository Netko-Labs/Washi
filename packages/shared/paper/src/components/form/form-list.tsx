import { type FormChoiceProps, fieldAria } from './lib'

/** Multi-select and relation: chips to drop, a menu to add. */
export function FormList({
  id,
  column,
  value,
  onChange,
  choices,
  required,
  error,
}: FormChoiceProps) {
  const items = Array.isArray(value) ? value : typeof value === 'string' && value ? [value] : []
  const label = (item: string) => choices.find((choice) => choice.value === item)?.label ?? item
  const rest = choices.filter((choice) => !items.includes(choice.value))
  return (
    <span className="wsx-db-list wsx-form-list">
      {items.map((item) => (
        <button
          key={item}
          type="button"
          className="wsx-db-chip"
          aria-label={`Remove ${label(item)} from ${column.name}`}
          onClick={() => onChange(items.filter((each) => each !== item))}
        >
          {label(item)} <span aria-hidden>×</span>
        </button>
      ))}
      <select
        id={id}
        {...fieldAria(id, required, error)}
        className="wsx-db-add"
        value=""
        disabled={rest.length === 0}
        onChange={(event) =>
          event.currentTarget.value && onChange([...items, event.currentTarget.value])
        }
      >
        <option value="">+</option>
        {rest.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </span>
  )
}
