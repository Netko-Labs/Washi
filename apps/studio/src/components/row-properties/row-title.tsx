import { FRESH_TITLE, type RowTitleProps } from './lib'

/** The row's name, typed in place as Notion does; the page's title follows it. A new row asks for one. */
export function RowTitle({ value, onSave }: RowTitleProps) {
  const isFresh = value === FRESH_TITLE
  return (
    <input
      key={value}
      defaultValue={value}
      // biome-ignore lint/a11y/noAutofocus: a row just made is opened to be named
      autoFocus={isFresh}
      onFocus={(event) => isFresh && event.currentTarget.select()}
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
