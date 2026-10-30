import { IconChevronLeft } from '@tabler/icons-react'
import { Floating } from '@/components/shared/floating'
import { SLASH_GROUP_LABELS, SLASH_STEPS, type SlashMenuProps } from './lib'

const HEADING =
  'px-2 pt-2 pb-1 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em] first:pt-1'

/** Typed `/` in a block: pick what it becomes. The arrows walk the rows; Enter takes the lit one. */
export function SlashMenu({ anchor, menu }: SlashMenuProps) {
  const { options, active, step } = menu

  return (
    <Floating
      anchor={anchor}
      offset={4}
      role="listbox"
      aria-label={step ? SLASH_STEPS[step].label : 'Turn this block into'}
      className="max-h-[min(360px,calc(100dvh-16px))] w-[300px] overflow-y-auto rounded-xl border border-border bg-popover p-1 font-sans text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      {step && (
        <button
          type="button"
          onMouseDown={(event) => {
            event.preventDefault()
            menu.back()
          }}
          className="mb-1 flex h-8 w-full items-center gap-1.5 rounded-lg border-border border-b px-2 text-left font-medium text-[13px] text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          <IconChevronLeft className="size-4" />
          {SLASH_STEPS[step].label}
        </button>
      )}
      {options.length === 0 && (
        <p className="px-2 py-1.5 text-[12.5px] text-muted-foreground">
          {step ? SLASH_STEPS[step].empty : 'No block by that name.'}
        </p>
      )}
      {options.map((option, index) => (
        <div key={option.type === 'text' ? option.kind : option.key} role="presentation">
          {!step && option.group !== options[index - 1]?.group && (
            <div role="presentation" className={HEADING}>
              {SLASH_GROUP_LABELS[option.group]}
            </div>
          )}
          <button
            ref={index === active ? (row) => row?.scrollIntoView({ block: 'nearest' }) : undefined}
            type="button"
            role="option"
            aria-selected={index === active}
            onMouseEnter={() => menu.hover(index)}
            onMouseDown={(event) => {
              event.preventDefault()
              menu.pick(option)
            }}
            className={`flex h-8 w-full items-center justify-between gap-3 rounded-lg px-2 text-left text-[13px] ${
              index === active ? 'bg-black/5 dark:bg-white/10' : ''
            }`}
          >
            <span className="truncate">{option.label}</span>
            <span
              className={`shrink-0 text-[11px] text-muted-foreground ${option.type === 'text' ? 'font-mono pointer-coarse:hidden' : ''}`}
            >
              {option.hint}
            </span>
          </button>
        </div>
      ))}
    </Floating>
  )
}
