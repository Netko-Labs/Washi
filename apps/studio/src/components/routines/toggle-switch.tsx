import type { ToggleSwitchProps } from './lib'

export function ToggleSwitch({ isOn, label, onChange }: ToggleSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={isOn}
      aria-label={label}
      onClick={(event) => {
        event.preventDefault()
        event.stopPropagation()
        onChange(!isOn)
      }}
      className={`relative h-5 w-9 shrink-0 rounded-full transition-colors ${isOn ? 'bg-primary' : 'bg-foreground/15'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow-sm transition-transform motion-reduce:transition-none ${isOn ? 'translate-x-4' : ''}`}
      />
    </button>
  )
}
