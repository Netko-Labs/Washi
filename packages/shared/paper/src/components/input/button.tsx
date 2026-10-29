import { useState } from 'react'
import { styled, useRunAction } from '../../lib'
import type { ButtonProps } from '../../lib/types'

export function Button({ action, children, ...rest }: ButtonProps) {
  const run = useRunAction()
  const [busy, setBusy] = useState(false)
  return (
    <button
      type="button"
      {...styled({ tone: 'accent', ...rest }, 'wsx-button')}
      disabled={busy}
      onClick={async () => {
        setBusy(true)
        try {
          await run(action)
        } finally {
          setBusy(false)
        }
      }}
    >
      {children}
    </button>
  )
}
