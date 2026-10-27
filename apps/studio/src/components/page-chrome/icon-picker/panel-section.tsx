import type { PanelSectionProps } from './lib'

export function PanelSection({ title, children }: PanelSectionProps) {
  return (
    <section className="pt-1.5">
      <h3 className="px-1 pb-1 font-semibold text-[10.5px] text-muted-foreground uppercase tracking-[0.06em]">
        {title}
      </h3>
      <div className="grid grid-cols-9">{children}</div>
    </section>
  )
}
