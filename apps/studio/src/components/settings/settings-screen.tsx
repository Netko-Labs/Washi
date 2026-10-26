import { PeopleSection } from '@/components/people'
import { RoutinesSection } from '@/components/routines'
import { AgentTab } from './agent-tab'
import { ADMIN_TABS, SETTINGS_TABS, type SettingsScreenProps, useInstanceAdmin } from './lib'
import { ServerTab } from './server-tab'

export function SettingsScreen({ workspaceId, tab, onTab }: SettingsScreenProps) {
  const isAdmin = useInstanceAdmin()
  const tabs = SETTINGS_TABS.filter((entry) => isAdmin || !ADMIN_TABS.has(entry.key))
  const current = tabs.find((entry) => entry.key === tab) ?? SETTINGS_TABS[0]
  const shown = current.key

  return (
    <section className="min-h-0 flex-1 overflow-y-auto">
      <div className="mx-auto max-w-[680px] px-5 pt-9 pb-16 md:px-10 md:pt-11">
        <h1 className="mb-1 font-semibold text-2xl tracking-[-0.02em]">Settings</h1>
        <p className="mb-[22px] text-muted-foreground">{current.desc}</p>

        <div className="mb-[26px] flex gap-1 overflow-x-auto border-border border-b">
          {tabs.map(({ key, label, icon: Icon }) => (
            <button
              type="button"
              key={key}
              onClick={() => onTab(key)}
              className={`-mb-px flex h-9 shrink-0 items-center gap-[7px] border-b-2 px-3 font-medium text-[13px] ${
                shown === key
                  ? 'border-primary text-foreground'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="size-3.5" />
              {label}
            </button>
          ))}
        </div>

        {shown === 'agent' && <AgentTab />}
        {shown === 'people' && <PeopleSection workspaceId={workspaceId} />}
        {shown === 'routines' && <RoutinesSection />}
        {shown === 'server' && <ServerTab />}
      </div>
    </section>
  )
}
