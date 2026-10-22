import type { SettingsCardProps } from '../../lib'

const TAG = {
  ok: 'bg-[#e7eedd] text-[#3f5a2d] dark:bg-[#2b3a22] dark:text-[#cfe3b8]',
  off: 'bg-[#fdf3dc] text-[#6b4a0a] dark:bg-[#3d2f12] dark:text-[#f1d59a]',
}

/** One question a person asks, as a card: a title, a line, a state, and rows under it. */
export function SettingsCard({ title, desc, tag, children }: SettingsCardProps) {
  return (
    <section className="overflow-hidden rounded-2xl border border-border bg-card">
      <div className="flex items-center gap-3 border-border border-b px-4 py-3.5">
        <div className="min-w-0">
          <h2 className="font-semibold text-[14px] leading-tight">{title}</h2>
          <p className="text-[12.5px] text-muted-foreground">{desc}</p>
        </div>
        {tag && (
          <span
            className={`ml-auto flex h-6 shrink-0 items-center gap-1.5 rounded-full px-2.5 font-semibold text-[11.5px] ${TAG[tag.tone]}`}
          >
            <span className="size-1.5 rounded-full bg-current" />
            {tag.label}
          </span>
        )}
      </div>
      {children}
    </section>
  )
}
