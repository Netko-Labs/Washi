import { initials, useViewStore } from '@washi/ui'
import { DangerButton, RowButton, SettingsCard, SettingsRow } from './SettingsControls'

export function SettingsAccountTab() {
  const identity = useViewStore((state) => state.identity)
  return (
    <div className="flex flex-col gap-[22px]">
      <SettingsCard>
        <div className="flex items-center gap-3.5 border-border border-b px-[18px] py-4">
          <span
            className="flex size-9 flex-none items-center justify-center rounded-full font-semibold text-xs"
            style={{ backgroundColor: identity.color, color: '#fff6e4' }}
          >
            {initials(identity.name)}
          </span>
          <div className="flex-1">
            <div className="font-medium">{identity.name}</div>
            <div className="text-muted-foreground text-xs">
              {identity.email || 'mira@hollowmoor.net'}
            </div>
          </div>
          <RowButton>Edit</RowButton>
        </div>
        <SettingsRow title="Devices" sub="MacBook (this device) · Studio desk · Pixel 9">
          <RowButton>Manage</RowButton>
        </SettingsRow>
        <SettingsRow
          title="Recovery key"
          sub="Last exported March 2026 — keep it off this machine"
          last
        >
          <RowButton>Export</RowButton>
        </SettingsRow>
      </SettingsCard>
      <SettingsCard>
        <SettingsRow
          title="Delete this vault"
          sub="Files on disk stay — this only removes it from Washi"
          last
        >
          <DangerButton>Delete</DangerButton>
        </SettingsRow>
      </SettingsCard>
    </div>
  )
}
