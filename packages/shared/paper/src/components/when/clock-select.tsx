import type { ClockSelectProps } from './lib'

/**
 * An hours list, the platform's own: a phone spins a wheel, a keyboard types "14" to jump, and it
 * opens scrolled to the time it holds — never a field to type a time into by hand.
 */
export function ClockSelect({ label, value, choices, className, onChange }: ClockSelectProps) {
  return (
    <select
      className={`${className} wsx-when-clock`}
      aria-label={label}
      value={value}
      onChange={(event) => onChange(event.currentTarget.value)}
    >
      {choices.map((choice) => (
        <option key={choice.value} value={choice.value}>
          {choice.label}
        </option>
      ))}
    </select>
  )
}
