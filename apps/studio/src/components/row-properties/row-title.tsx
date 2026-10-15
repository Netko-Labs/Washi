import type { RowTitleProps } from './lib'

/** The row's name, typed in place as Notion does; the page's title follows it. */
export function RowTitle({ value, onSave }: RowTitleProps) {
  return (
    <input
      key={value}
      defaultValue={value}
      placeholder="Untitled"
      aria-label="Name"
      className="w-full bg-transparent font-bold text-[32px] leading-tight outline-none placeholder:text-muted-foreground/50"
      onKeyDown={(event) => event.key === 'Enter' && event.currentTarget.blur()}
      onBlur={(event) => {
        const next = event.currentTarget.value.trim()
        if (next !== value) onSave(next || null)
      }}
    />
  )
}
