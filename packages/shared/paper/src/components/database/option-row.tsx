import { useState } from 'react'
import type { OptionRowProps } from './lib'

/** One option, renamed where it stands: Enter or leaving the field keeps the new name. */
export function OptionRow({ option, busy, onRename, onRemove }: OptionRowProps) {
  const [text, setText] = useState(option)

  const commit = () => {
    const to = text.trim()
    if (to && to !== option) onRename(to)
    else setText(option)
  }

  return (
    <div className="wsx-db-option">
      <input
        aria-label={`Rename ${option}`}
        value={text}
        maxLength={64}
        readOnly={busy}
        onChange={(event) => setText(event.currentTarget.value)}
        onBlur={commit}
        onKeyDown={(event) => {
          if (event.key !== 'Enter') return
          event.preventDefault()
          event.currentTarget.blur()
        }}
      />
      <button type="button" aria-label={`Remove ${option}`} disabled={busy} onClick={onRemove}>
        ×
      </button>
    </div>
  )
}
