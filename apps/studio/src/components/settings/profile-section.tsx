import { initials, useViewStore } from '@washi/ui'
import { auth } from '@/integrations/auth'
import { useNameDraft } from './lib'
import { NameField, SettingRow, SettingsCard } from './shared/card'

/** Your name is what a mention, a comment and a person cell show the team. */
export function ProfileSection() {
  const identity = useViewStore((state) => state.identity)
  const name = useNameDraft(identity.name, async (next) => {
    const { error } = await auth.updateUser({ name: next })
    if (error) throw new Error(error.message ?? 'the server refused the new name')
    useViewStore.getState().setIdentity({ name: next })
  })

  return (
    <SettingsCard title="You" desc="Shared with everyone in your workspaces.">
      <div className="flex items-center gap-3 px-5 pt-5 pb-1">
        <span
          className="grid size-12 place-items-center rounded-full font-semibold text-[17px]"
          style={{ backgroundColor: identity.color, color: '#fff6e4' }}
        >
          {initials(identity.name)}
        </span>
        <span className="min-w-0">
          <span className="block truncate font-semibold text-[15px]">{identity.name}</span>
          <span className="block truncate text-[12.5px] text-muted-foreground">
            {identity.email}
          </span>
        </span>
      </div>
      <NameField label="Name" field={name} hint="How teammates see you." />
      <SettingRow
        label="Email"
        hint="Where invitations and sign-in go. Ask an app admin to change it."
      >
        <span className="min-w-0 break-all text-[13px] text-muted-foreground">
          {identity.email}
        </span>
      </SettingRow>
    </SettingsCard>
  )
}
