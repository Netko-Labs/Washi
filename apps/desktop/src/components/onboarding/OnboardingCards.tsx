import { IconCheck } from '@tabler/icons-react'
import { Toggle } from './OnboardingArt'
import type { ChoiceCardProps, ConsentCardProps } from './types'

export function ChoiceCard({ selected, onClick, icon: Icon, title, desc }: ChoiceCardProps) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`flex items-start gap-3 rounded-xl border px-4 py-3.5 text-left ${selected ? 'border-foreground bg-accent' : 'border-border bg-card'}`}
    >
      <Icon className="mt-px size-[18px] shrink-0 text-muted-foreground" />
      <span className="flex-1">
        <span className="block font-medium text-[14px]">{title}</span>
        <span className="block text-[12.5px] text-muted-foreground leading-[1.5]">{desc}</span>
      </span>
      {selected && <IconCheck className="size-4 shrink-0 text-foreground" />}
    </button>
  )
}

export function ConsentCard({ art, title, desc, on, onToggle }: ConsentCardProps) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3.5">
      {art}
      <span className="flex-1 text-[13px] leading-[1.55]">
        {title}
        <span className="block text-[11.5px] text-muted-foreground">{desc}</span>
      </span>
      <Toggle on={on} onClick={onToggle} />
    </div>
  )
}
