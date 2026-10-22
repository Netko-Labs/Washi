import { FILTER_LABELS, type InboxChipProps } from './lib'

export function InboxChip({ filter, active, count, onPick }: InboxChipProps) {
  const on = filter === active
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => onPick(filter)}
      className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[12px] ${
        on
          ? 'border-foreground bg-foreground text-background'
          : 'border-border text-muted-foreground hover:bg-accent hover:text-foreground'
      }`}
    >
      {FILTER_LABELS[filter]}
      {count !== undefined && count > 0 && (
        <span className={`font-mono text-[10.5px] ${on ? 'opacity-80' : ''}`}>{count}</span>
      )}
    </button>
  )
}
