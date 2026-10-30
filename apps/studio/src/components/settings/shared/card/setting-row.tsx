import type { SettingRowProps } from '../../lib'

/** Label and hint on the left, the control on the right; on a phone, the control under them. */
export function SettingRow({ label, hint, icon: Icon, children }: SettingRowProps) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-border border-t px-5 py-4 text-[13.5px] first:border-t-0 max-[480px]:flex-col max-[480px]:items-start">
      {Icon && <Icon className="size-4 shrink-0 text-muted-foreground" />}
      <div className="min-w-0 flex-1 max-[480px]:flex-none">
        <div className="font-medium">{label}</div>
        {hint && <div className="mt-0.5 text-[12.5px] text-muted-foreground">{hint}</div>}
      </div>
      <div className="flex max-w-full shrink-0 items-center gap-2">{children}</div>
    </div>
  )
}
