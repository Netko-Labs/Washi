import { PeopleSection } from '@/components/people'
import { AgentTab } from './agent-tab'
import { GeneralSection } from './general-section'
import { ADMIN_TABS, SETTINGS_GROUPS, type SettingsScreenProps, useInstanceAdmin } from './lib'
import { PreferencesSection } from './preferences-section'
import { ProfileSection } from './profile-section'
import { ServerTab } from './server-tab'
import { SettingsTabs } from './settings-tabs'

/** Every section in one column: whose it is as pills (yours, the team's, Washi's, the server's), then its tabs. */
export function SettingsScreen({ workspaceId, tab, onTab }: SettingsScreenProps) {
  const isAdmin = useInstanceAdmin()
  const groups = SETTINGS_GROUPS.map((group) => ({
    ...group,
    sections: group.sections.filter((section) => isAdmin || !ADMIN_TABS.has(section.key)),
  })).filter((group) => group.sections.length > 0)
  const sections = groups.flatMap((group) => group.sections)
  const current = sections.find((section) => section.key === tab) ?? sections[0]
  if (!current) return null
  const shown = current.key

  return (
    <section className="min-h-0 flex-1 overflow-y-auto overscroll-y-none">
      <div className="mx-auto max-w-[720px] px-5 pt-9 pb-16 md:px-10 md:pt-11">
        <h1 className="mb-5 font-semibold text-[26px] tracking-[-0.02em]">Settings</h1>
        <SettingsTabs groups={groups} current={shown} onTab={onTab} />
        <div>
          <p className="mb-5 text-[13.5px] text-muted-foreground">{current.desc}</p>

          {shown === 'profile' && <ProfileSection />}
          {shown === 'preferences' && <PreferencesSection />}
          {shown === 'general' && <GeneralSection workspaceId={workspaceId} />}
          {shown === 'people' && <PeopleSection workspaceId={workspaceId} />}
          {(shown === 'models' || shown === 'outside' || shown === 'usage') && (
            <AgentTab part={shown} />
          )}
          {shown === 'server' && <ServerTab />}
        </div>
      </div>
    </section>
  )
}
