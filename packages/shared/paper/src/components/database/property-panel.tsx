import { useId } from 'react'
import { needsOptions, PROPERTY_TYPES, type PropertyPanelProps, usePropertyDraft } from './lib'
import { PropertyIcon } from './property-icon'
import { PropertyOptions } from './property-options'

/** Name first, then a type off a list the arrow keys walk; Enter adds it. */
export function PropertyPanel(props: PropertyPanelProps) {
  const { draft, status, edit, step, submit } = usePropertyDraft(props)
  const group = useId()
  const chosen = PROPERTY_TYPES.find(({ type }) => type === draft.type)

  return (
    <form
      className="wsx-db-panel"
      aria-label="New property"
      onSubmit={(event) => {
        event.preventDefault()
        void submit()
      }}
    >
      <label className="wsx-db-panel-name">
        <PropertyIcon type={draft.type} />
        <input
          // biome-ignore lint/a11y/noAutofocus: the panel opens because the person asked for it
          autoFocus
          placeholder="Property name"
          aria-label="Property name"
          value={draft.label}
          maxLength={64}
          onChange={(event) => edit({ label: event.currentTarget.value })}
          onKeyDown={(event) => {
            if (event.key !== 'ArrowDown' && event.key !== 'ArrowUp') return
            event.preventDefault()
            step(event.key === 'ArrowDown' ? 1 : -1)
          }}
        />
      </label>
      <fieldset className="wsx-db-types">
        <legend className="wsx-db-panel-head">Type</legend>
        {PROPERTY_TYPES.map(({ type, label }) => (
          <label key={type} className="wsx-db-type">
            <input
              type="radio"
              name={group}
              value={type}
              checked={type === draft.type}
              onChange={() => edit({ type })}
            />
            <PropertyIcon type={type} />
            {label}
          </label>
        ))}
      </fieldset>
      {needsOptions(draft.type) && <PropertyOptions draft={draft} edit={edit} />}
      {status.error && (
        <p className="wsx-db-panel-error" role="alert">
          {status.error}
        </p>
      )}
      <div className="wsx-db-panel-foot">
        <span className="wsx-db-panel-hint">{chosen?.hint}</span>
        <button type="submit" className="wsx-db-button" disabled={status.busy}>
          {status.busy ? 'Adding…' : 'Add'}
        </button>
      </div>
    </form>
  )
}
