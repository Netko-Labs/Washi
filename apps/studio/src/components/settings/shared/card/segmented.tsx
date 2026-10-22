import type { SegmentedProps } from '../../lib'

export function Segmented<T extends string>({ value, options, onChange }: SegmentedProps<T>) {
  return (
    <div className="inline-flex rounded-[10px] border border-border bg-background p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          aria-pressed={option.id === value}
          title={option.desc}
          onClick={() => onChange(option.id)}
          className={`h-7 rounded-lg px-3 font-medium text-[12.5px] ${
            option.id === value
              ? 'bg-foreground text-background'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
