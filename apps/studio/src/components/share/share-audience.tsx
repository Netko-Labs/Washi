import { IconLock, IconUsers, IconWorld } from '@tabler/icons-react'
import { AUDIENCES, type ShareAudienceProps } from './lib'

const ICONS = { shared: IconUsers, private: IconLock, public: IconWorld }

export function ShareAudience({ value, busy, onChange }: ShareAudienceProps) {
  return (
    <div role="radiogroup" aria-label="Who can read this page" className="grid gap-1">
      {AUDIENCES.map((audience) => {
        const Icon = ICONS[audience.id]
        const on = value === audience.id
        return (
          <button
            key={audience.id}
            type="button"
            role="radio"
            aria-checked={on}
            disabled={busy}
            onClick={() => onChange(audience.id)}
            className={`flex items-start gap-2.5 rounded-lg px-2 py-2 text-left disabled:opacity-60 ${
              on ? 'bg-accent' : 'hover:bg-accent'
            }`}
          >
            <Icon
              className={`mt-0.5 size-4 shrink-0 ${on ? 'text-primary' : 'text-muted-foreground'}`}
            />
            <span className="min-w-0">
              <span className="block font-medium text-[13px]">{audience.title}</span>
              <span className="block text-[12px] text-muted-foreground leading-snug">
                {audience.text}
              </span>
            </span>
          </button>
        )
      })}
    </div>
  )
}
