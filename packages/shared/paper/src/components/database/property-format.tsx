import { useId } from 'react'
import { NUMBER_FORMATS, type PropertyFormatProps } from './lib'

/** How the new number reads: plain, a percent, or money — one press, arrow keys walk it. */
export function PropertyFormat({ draft, edit }: PropertyFormatProps) {
  const group = useId()
  return (
    <fieldset className="wsx-db-panel-options wsx-db-formats">
      <legend className="wsx-db-panel-head">Format</legend>
      <div className="wsx-db-format-row">
        {NUMBER_FORMATS.map(({ value, label, name }) => (
          <label key={value || 'plain'} className="wsx-db-format" title={name}>
            <input
              type="radio"
              name={group}
              value={value}
              checked={draft.format === value}
              aria-label={name}
              onChange={() => edit({ format: value })}
            />
            <span aria-hidden>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}
