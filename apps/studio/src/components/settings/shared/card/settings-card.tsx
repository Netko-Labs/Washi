import type { SettingsCardProps } from '../../lib'

const TAG = {
  ok: 'bg-[#e7eedd] text-[#3f5a2d] dark:bg-[#2b3a22] dark:text-[#cfe3b8]',
  off: 'bg-[#fdf3dc] text-[#6b4a0a] dark:bg-[#3d2f12] dark:text-[#f1d59a]',
}

/** One question a person asks: its heading and line above, its rows in a box below. */
export function SettingsCard({ title, desc, tag, children }: SettingsCardProps) {
  return (
    <section>
      <div className="mb-3 flex items-end gap-3 px-1">
        <div className="min-w-0">
          <h2 className="font-semibold text-[15px] leading-tight">{title}</h2>
          <p className="mt-0.5 text-[12.5px] text-muted-foreground">{desc}</p>
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
      <div className="overflow-hidden rounded-2xl border border-border bg-card">{children}</div>
    </section>
  )
}
