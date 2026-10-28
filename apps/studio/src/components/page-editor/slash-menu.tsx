import { useSheetsStore } from '@washi/ui'
import { type SlashMenuProps, slashMatches, useEditorStore } from './lib'

/** Typed `/` in an empty block: pick what the block becomes. Enter takes the first match. */
export function SlashMenu({ query, onPick }: SlashMenuProps) {
  const tables = useEditorStore((state) => state.tables)
  const sheets = useSheetsStore((state) => state.sheets)
  const options = slashMatches(
    query,
    tables,
    sheets.filter((sheet) => !sheet.rowOf),
  )

  return (
    <div
      role="listbox"
      aria-label="Turn this block into"
      className="absolute top-full left-0 z-30 mt-1 max-h-[320px] w-[280px] overflow-y-auto rounded-xl border border-border bg-popover p-1 font-sans text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      {options.length === 0 && (
        <p className="px-2 py-1.5 text-[12.5px] text-muted-foreground">No block by that name.</p>
      )}
      {options.map((option, index) => (
        <button
          key={option.type === 'text' ? option.kind : option.key}
          type="button"
          role="option"
          aria-selected={index === 0}
          onMouseDown={(event) => {
            event.preventDefault()
            onPick(option)
          }}
          className={`flex h-8 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-[13px] hover:bg-black/5 dark:hover:bg-white/10 ${
            index === 0 ? 'bg-black/5 dark:bg-white/10' : ''
          } ${option.type === 'data' && options[index - 1]?.type === 'text' ? 'mt-1 border-border border-t' : ''}`}
        >
          <span className="truncate">{option.label}</span>
          <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
            {option.hint}
          </span>
        </button>
      ))}
    </div>
  )
}
