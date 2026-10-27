import type { SettingRowProps } from '../../lib'

/** Label and hint on the left, the control on the right; one per line under a card. */
export function SettingRow({ label, hint, icon: Icon, children }: SettingRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-border border-t px-5 py-4 text-[13.5px] first:border-t-0">
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1">
        <div className="font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}
