import type { PropertyOptionsProps } from './lib'

/** A select's choices as chips: Enter or a comma keeps one, Backspace on empty takes the last back. */
export function PropertyOptions({ draft, edit }: PropertyOptionsProps) {
  const keep = (typed: string[], typing = '') =>
    edit({
      options: [
        ...new Set([...draft.options, ...typed.map((each) => each.trim()).filter(Boolean)]),
      ],
      typing,
    })

  return (
    <div className="wsx-db-panel-options">
      <p className="wsx-db-panel-head">Options</p>
      <div className="wsx-db-chips">
        {draft.options.map((option) => (
          <span key={option} className="wsx-db-chip">
            {option}
            <button
              type="button"
              aria-label={`Remove ${option}`}
              onClick={() => edit({ options: draft.options.filter((each) => each !== option) })}
            >
              ×
            </button>
          </span>
        ))}
        <input
          aria-label="Add an option"
          placeholder={draft.options.length ? 'Another…' : 'Type an option, press Enter'}
          value={draft.typing}
          onChange={(event) => {
            const parts = event.currentTarget.value.split(',')
            const typing = parts.pop() ?? ''
            parts.length ? keep(parts, typing) : edit({ typing })
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' && draft.typing.trim()) {
              event.preventDefault()
              keep([draft.typing])
            }
            if (event.key === 'Backspace' && !draft.typing && draft.options.length) {
              edit({ options: draft.options.slice(0, -1) })
            }
          }}
        />
      </div>
    </div>
  )
}
