import { initials } from '@washi/ui'
import type { MentionPickerProps } from './lib'

export function MentionPicker({ matches, active, onPick }: MentionPickerProps) {
  return (
    <div
      role="listbox"
      aria-label="Mention someone"
      className="absolute bottom-full left-0 z-30 mb-1 w-full rounded-xl border border-border bg-popover p-1 shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
    >
      {matches.map((member, index) => (
        <button
          key={member.id}
          type="button"
          role="option"
          aria-selected={index === active}
          onMouseDown={(event) => {
            event.preventDefault()
            onPick(member)
          }}
          className={`flex h-8 w-full items-center gap-2 rounded-lg px-2 text-left text-[13px] hover:bg-accent ${
            index === active ? 'bg-accent' : ''
          }`}
        >
          <span className="grid size-5 place-items-center rounded-full bg-primary font-semibold text-[9px] text-primary-foreground">
            {initials(member.name)}
          </span>
          {member.name}
        </button>
      ))}
    </div>
  )
}
