import type { ReactNode } from 'react'

export function SettingsCard({ children }: { children: ReactNode }) {
  return (
    <div className="overflow-hidden rounded-[14px] border border-border bg-card">{children}</div>
  )
}

export function SettingsRow({
  title,
  sub,
  mono = false,
  wrap = false,
  last = false,
  children,
}: {
  title: string
  sub: string
  mono?: boolean
  wrap?: boolean
  last?: boolean
  children: ReactNode
}) {
  return (
    <div
      className={`flex items-center gap-4 px-[18px] py-4 ${wrap ? 'flex-wrap' : ''} ${
        last ? '' : 'border-border border-b'
      }`}
    >
      <div className={wrap ? 'min-w-0 flex-[1_1_180px]' : 'flex-1'}>
        <div className="font-medium">{title}</div>
        <div className={`text-muted-foreground text-xs ${mono ? 'font-mono' : ''}`}>{sub}</div>
      </div>
      {children}
    </div>
  )
}

export function StaticToggle({ on }: { on: boolean }) {
  return (
    <span
      className={`flex h-4 w-7 flex-none items-center rounded-full p-0.5 ${
        on ? 'justify-end bg-primary' : 'bg-border'
      }`}
    >
      <span className="size-3 rounded-full bg-background shadow-sm" />
    </span>
  )
}

export function SegmentedControl({
  options,
  active,
  onSelect,
}: {
  options: string[]
  active: string
  onSelect?: (option: string) => void
}) {
  return (
    <span className="flex flex-none overflow-hidden rounded-[10px] border border-border">
      {options.map((option, index) => (
        <button
          type="button"
          key={option}
          onClick={() => onSelect?.(option)}
          className={`h-8 px-3 text-[13px] ${index > 0 ? 'border-border border-l' : ''} ${
            option === active
              ? 'bg-primary text-primary-foreground'
              : 'bg-background text-muted-foreground'
          }`}
        >
          {option}
        </button>
      ))}
    </span>
  )
}

export function RowButton({ children, onClick }: { children: ReactNode; onClick?: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="h-8 flex-none rounded-[10px] border border-border bg-background px-3 text-[13px] text-foreground hover:bg-accent"
    >
      {children}
    </button>
  )
}

export function DangerButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="button"
      className="h-8 flex-none rounded-[10px] bg-destructive px-3 font-medium text-[13px] text-white hover:opacity-90"
    >
      {children}
    </button>
  )
}
