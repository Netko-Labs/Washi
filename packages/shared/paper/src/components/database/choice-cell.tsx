import { toneOf } from '../../lib'
import { type ChoiceCellProps, type ChoiceLookProps, hueAt, initialsOf, statusGroupOf } from './lib'

/** A status reads by its step, a person by their face, a select by its own hue. */
function ChoiceLook({ column, value, label, index }: ChoiceLookProps) {
  if (column.type === 'status') {
    return (
      <span className="wsx-db-status" data-group={statusGroupOf(column, value)}>
        <i />
        {label}
      </span>
    )
  }
  if (column.type === 'person') {
    return (
      <span className="wsx-db-person">
        <span className="wsx-db-face">{initialsOf(label)}</span>
        {label}
      </span>
    )
  }
  return (
    <span
      className="wsx-db-pill"
      data-tone={toneOf(label)}
      data-hue={toneOf(label) ? undefined : hueAt(index)}
    >
      {label}
    </span>
  )
}

/**
 * Select, status, person: shown as Notion shows them, picked with the platform's own list — the
 * select lies invisible over the pill, so a click opens it and every keyboard and reader works.
 */
export function ChoiceCell({ column, value, commit, choices }: ChoiceCellProps) {
  const current = typeof value === 'string' ? value : ''
  const index = choices.findIndex((choice) => choice.value === current)
  const label = index >= 0 ? (choices[index]?.label ?? current) : current
  return (
    <span className="wsx-db-pick">
      {current ? (
        <ChoiceLook column={column} value={current} label={label} index={index} />
      ) : (
        <span className="wsx-db-placeholder">Empty</span>
      )}
      <select
        className="wsx-db-pick-select"
        aria-label={column.name}
        value={current}
        onChange={(event) => commit(event.currentTarget.value || null)}
      >
        <option value="">Empty</option>
        {current && index < 0 && <option value={current}>{current}</option>}
        {choices.map((choice) => (
          <option key={choice.value} value={choice.value}>
            {choice.label}
          </option>
        ))}
      </select>
    </span>
  )
}
