import { PeopleSection } from '@/components/people'
import { RoutinesSection } from '@/components/routines'
import { AgentTab } from './agent-tab'
import { GeneralSection } from './general-section'
import { ADMIN_TABS, SETTINGS_GROUPS, type SettingsScreenProps, useInstanceAdmin } from './lib'
import { PreferencesSection } from './preferences-section'
import { ProfileSection } from './profile-section'
import { ServerTab } from './server-tab'
import { SettingsNav } from './settings-nav'

/** Every section in one place, grouped by whose it is: yours, the team's, Washi's, the server's. */
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
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto flex max-w-[980px] flex-col gap-6 px-5 pt-9 pb-16 md:flex-row md:gap-12 md:px-10 md:pt-11">
        <SettingsNav groups={groups} current={shown} onTab={onTab} />
        <div className="min-w-0 max-w-[680px] flex-1">
          <h1 className="font-semibold text-2xl tracking-[-0.02em]">{current.label}</h1>
          <p className="mt-1 mb-6 text-muted-foreground">{current.desc}</p>

          {shown === 'profile' && <ProfileSection />}
          {shown === 'preferences' && <PreferencesSection />}
          {shown === 'general' && <GeneralSection workspaceId={workspaceId} />}
          {shown === 'people' && <PeopleSection workspaceId={workspaceId} />}
          {(shown === 'models' || shown === 'outside' || shown === 'usage') && (
            <AgentTab part={shown} />
          )}
          {shown === 'routines' && <RoutinesSection />}
          {shown === 'server' && <ServerTab />}
        </div>
      </div>
    </section>
  )
}
