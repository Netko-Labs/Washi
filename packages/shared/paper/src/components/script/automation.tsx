import { styled } from '../../lib'
import type { AutomationProps } from '../../lib/types'

const WHEN = { insert: 'is added to', update: 'changes in' } as const

/** An automation draws nothing of its own: it says what it listens for, and that the server runs it. */
export function Automation({ table, on, title, ...rest }: AutomationProps) {
  return (
    <aside {...styled(rest, 'wsx-automation')}>
      <span className="wsx-automation-mark" aria-hidden>
        ⚡
      </span>
      <span>
        <strong>{title ?? 'An automation'}</strong>
        <span className="wsx-automation-when">
          When a row {WHEN[on]} <code>{table}</code> · runs on the server, for everyone
        </span>
      </span>
    </aside>
  )
}
