import { useState } from 'react'
import { resolveArgs, styled, useRunAction } from '../../lib'
import type { ComposeProps } from '../../lib/types'

/** A text box that runs one verb with `$value` and `$now` filled in — the comment box. */
export function Compose({ action, label, placeholder, multiline, ...rest }: ComposeProps) {
  const run = useRunAction()
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)
  const submit = async () => {
    const value = text.trim()
    if (!value) return
    setBusy(true)
    try {
      const args: Record<string, string> = {}
      args.$value = value
      args.$now = new Date().toISOString()
      await run(resolveArgs(action as never, args) as never)
      setText('')
    } finally {
      setBusy(false)
    }
  }
  const Input = multiline ? 'textarea' : 'input'
  return (
    <div {...styled(rest, 'wsx-compose')}>
      <Input
        className="wsx-field-input"
        placeholder={placeholder}
        value={text}
        rows={multiline ? 3 : undefined}
        onChange={(event) => setText(event.target.value)}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && !event.shiftKey && !multiline) {
            event.preventDefault()
            void submit()
          }
        }}
      />
      <button
        type="button"
        className="wsx-button"
        data-tone="accent"
        data-size="sm"
        disabled={busy || !text.trim()}
        onClick={() => void submit()}
      >
        {label ?? 'Post'}
      </button>
    </div>
  )
}
