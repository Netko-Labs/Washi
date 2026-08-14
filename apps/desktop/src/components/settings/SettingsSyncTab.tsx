import { RowButton, SettingsCard, SettingsRow, StaticToggle } from './SettingsControls'

const MEMBERS = [
  { initials: 'JO', email: 'jo@studio.com', role: 'Can edit' },
  { initials: 'RU', email: 'rui@studio.com', role: 'Can comment' },
]

export function SettingsSyncTab() {
  return (
    <div className="flex flex-col gap-[22px]">
      <SettingsCard>
        <SettingsRow title="Sync server" sub="Not connected — this vault is local only">
          <span className="size-2 flex-none rounded-full bg-muted-foreground" />
          <RowButton>Connect…</RowButton>
        </SettingsRow>
        <SettingsRow title="End-to-end encryption" sub="The server stores ciphertext it can't read">
          <StaticToggle on />
        </SettingsRow>
        <SettingsRow
          title="Read-only share links"
          sub="Publish single pages, no account needed to read"
          last
        >
          <StaticToggle on={false} />
        </SettingsRow>
      </SettingsCard>
      <SettingsCard>
        <div className="flex items-center gap-2 border-border border-b px-[18px] py-3">
          <span className="font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
            Members
          </span>
          <button
            type="button"
            className="ml-auto h-[26px] rounded-lg border border-border bg-background px-2.5 text-foreground text-xs hover:bg-accent"
          >
            Invite
          </button>
        </div>
        {MEMBERS.map((member) => (
          <div
            key={member.email}
            className="flex items-center gap-2.5 border-border border-b px-[18px] py-[11px]"
          >
            <span className="flex size-[26px] flex-none items-center justify-center rounded-full bg-muted font-semibold text-[10.5px]">
              {member.initials}
            </span>
            <span className="min-w-0 flex-1 truncate text-[13px]">{member.email}</span>
            <span className="text-muted-foreground text-xs">{member.role}</span>
          </div>
        ))}
      </SettingsCard>
    </div>
  )
}
