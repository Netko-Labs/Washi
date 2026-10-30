import type { SegmentedProps } from '../../lib'

export function Segmented<T extends string>({
  value,
  options,
  onChange,
  describe,
}: SegmentedProps<T>) {
  const control = (
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
  if (!describe) return control
  return (
    <div className="grid max-w-[260px] justify-items-end gap-1.5 max-[480px]:justify-items-start">
      {control}
      <span className="text-right text-[12px] text-muted-foreground leading-snug max-[480px]:text-left">
        {options.find((option) => option.id === value)?.desc}
      </span>
    </div>
  )
}
