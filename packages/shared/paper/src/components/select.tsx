import { styled } from '../lib'
import type { SelectProps } from '../lib/types'
import { useSheetState } from '../state'

/** One choice into page state; every view whose filter reads that state follows it (D72). */
export function Select({ state, label, options, all, ...rest }: SelectProps) {
  const sheet = useSheetState()
  const current = sheet.values[state]
  const value = current === null || current === undefined ? '' : String(current)

  return (
    <label {...styled(rest, 'wsx-select-row')}>
      {label && <span className="wsx-select-label">{label}</span>}
      <select
        className="wsx-field-input wsx-select"
        value={value}
        aria-label={label ?? state}
        onChange={(event) => sheet.set(state, event.currentTarget.value || null)}
      >
        {all && <option value="">{all}</option>}
        {!all && value === '' && <option value="">—</option>}
        {options.map((option) => {
          const { value: optionValue, label: optionLabel } =
            typeof option === 'string' ? { value: option, label: option } : option
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </label>
  )
}
