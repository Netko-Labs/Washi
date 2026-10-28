import { styled } from '../../lib'
import type { AutomationProps, FormulaProps } from '../../lib/types'

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

/** A function the workspace's formula columns may call; on the page, only its name and what it is. */
export function Formula({ name, title, ...rest }: FormulaProps) {
  return (
    <aside {...styled(rest, 'wsx-automation')}>
      <span className="wsx-automation-mark" aria-hidden>
        ƒ
      </span>
      <span>
        <strong>{title ?? `${name}(…)`}</strong>
        <span className="wsx-automation-when">
          A formula function — any table’s formula may call <code>{name}(…)</code>
        </span>
      </span>
    </aside>
  )
}
