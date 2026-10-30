import { useState } from 'react'
import type { OptionAddProps } from './lib'

/** A new option, typed and kept with Enter. */
export function OptionAdd({ label, busy, onAdd }: OptionAddProps) {
  const [text, setText] = useState('')

  return (
    <input
      className="wsx-db-option-add"
      aria-label={label}
      placeholder={`+ ${label}`}
      value={text}
      maxLength={64}
      readOnly={busy}
      onChange={(event) => setText(event.currentTarget.value)}
      onKeyDown={(event) => {
        const to = text.trim()
        if (event.key !== 'Enter' || !to) return
        event.preventDefault()
        onAdd(to)
        setText('')
      }}
    />
  )
}
