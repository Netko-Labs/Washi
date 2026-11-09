import type { ShareSwitchProps } from './lib'

/** One of a link's switches, a person's alone: an icon, what it does in words, on or off. */
export function ShareSwitch({
  icon: Icon,
  label,
  detail,
  value,
  busy,
  onChange,
}: ShareSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={value}
      disabled={busy}
      onClick={() => onChange(!value)}
      className="flex w-full items-start gap-2.5 rounded-lg px-2 py-2 text-left hover:bg-accent disabled:opacity-60"
    >
      <Icon
        className={`mt-0.5 size-4 shrink-0 ${value ? 'text-primary' : 'text-muted-foreground'}`}
      />
      <span className="min-w-0 flex-1">
        <span className="block font-medium text-[13px]">{label}</span>
        <span className="block text-[12px] text-muted-foreground leading-snug">{detail}</span>
      </span>
      <span
        aria-hidden
        // The routines' and models' switch: a white knob on a track from the ink, so off reads in dark too.
        className={`mt-0.5 flex h-5 w-9 shrink-0 items-center rounded-full p-0.5 transition-colors ${
          value ? 'justify-end bg-primary' : 'justify-start bg-foreground/15'
        }`}
      >
        <span className="size-4 rounded-full bg-white shadow-sm" />
      </span>
    </button>
  )
}
