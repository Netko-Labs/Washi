import { styled } from '../../lib'
import type { SwitchProps } from '../../lib/types'
import { useSheetState } from '../../state'

export function Switch({ state, label, ...rest }: SwitchProps) {
  const sheet = useSheetState()
  const on = sheet.values[state] === true
  return (
    <label {...styled(rest, 'wsx-switch-row')}>
      <button
        type="button"
        role="switch"
        aria-checked={on}
        className="wsx-switch"
        onClick={() => sheet.set(state, !on)}
      >
        <i />
      </button>
      {label}
    </label>
  )
}
