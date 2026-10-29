import { styled } from '../../lib'
import type { SliderProps } from '../../lib/types'
import { useSheetState } from '../../state'

export function Slider({ state, min = 0, max = 100, step = 1, label, ...rest }: SliderProps) {
  const sheet = useSheetState()
  const value = typeof sheet.values[state] === 'number' ? (sheet.values[state] as number) : min
  return (
    <label {...styled(rest, 'wsx-slider')}>
      <span className="wsx-slider-head">
        <span>{label ?? state}</span>
        <span>{value}</span>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(event) => sheet.set(state, Number(event.target.value))}
      />
    </label>
  )
}
