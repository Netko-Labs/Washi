import { Mascot } from '@washi/ui'
import type { StepProps } from './types'

const PROFILE_COLORS = ['#cf6b36', '#6b7f5e', '#5e6b7f', '#a08d77']

export function StepProfile({ draft, patch }: StepProps) {
  const shown = (draft.user.trim() || 'M K')
    .split(/\s+/)
    .map((word: string) => word[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase()

  return (
    <div className="flex flex-col gap-5">
      <div className="flex justify-center">
        <Mascot face="happy" motion="bob" size={120} className="mascot-motion" />
      </div>
      <div>
        <h1 className="font-semibold text-[26px]">This is you</h1>
        <p className="text-[14.5px] text-muted-foreground">
          Shown on your edits and shared pages. Stays on this device unless you turn on sync.
        </p>
      </div>
      <div className="flex items-center gap-4">
        <span
          className="grid size-16 place-items-center rounded-full font-semibold text-[22px]"
          style={{ backgroundColor: draft.color, color: '#fff6e4' }}
        >
          {shown}
        </span>
        <div className="flex gap-2">
          {PROFILE_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              aria-label={`Accent ${color}`}
              onClick={() => patch({ color })}
              className="box-border size-[30px] rounded-full border-2"
              style={{
                backgroundColor: color,
                borderColor: draft.color === color ? 'var(--foreground)' : 'transparent',
              }}
            />
          ))}
        </div>
      </div>
      <label className="flex flex-col gap-1.5 text-[13px]">
        <span className="font-medium">Display name</span>
        <input
          value={draft.user}
          onChange={(event) => patch({ user: event.target.value })}
          placeholder="Mira Kaneko"
          className="h-[38px] rounded-[10px] border border-input bg-card px-3 text-[14px] outline-none focus:border-muted-foreground"
        />
      </label>
      <label className="flex flex-col gap-1.5 text-[13px]">
        <span className="font-medium">
          Email{' '}
          <span className="font-normal text-muted-foreground">— optional, for sync invites</span>
        </span>
        <input
          value={draft.email}
          onChange={(event) => patch({ email: event.target.value })}
          placeholder="mira@hollowmoor.net"
          className="h-[38px] rounded-[10px] border border-input bg-card px-3 text-[14px] outline-none focus:border-muted-foreground"
        />
      </label>
    </div>
  )
}
