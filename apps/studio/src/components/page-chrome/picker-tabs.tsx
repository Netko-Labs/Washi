import type { PickerTabsProps } from './lib'

export function PickerTabs<T extends string>({ tabs, active, onChange }: PickerTabsProps<T>) {
  return (
    <div className="mb-2 flex gap-0.5 border-border border-b">
      {tabs.map((entry) => (
        <button
          key={entry.id}
          type="button"
          aria-pressed={active === entry.id}
          onClick={() => onChange(entry.id)}
          className={`-mb-px h-7 border-b-2 px-2.5 font-medium text-[12.5px] ${
            active === entry.id
              ? 'border-primary text-foreground'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          }`}
        >
          {entry.label}
        </button>
      ))}
    </div>
  )
}
