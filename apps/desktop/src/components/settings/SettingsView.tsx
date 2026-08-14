import { IconAdjustmentsHorizontal, IconRefresh, IconRobot, IconUser } from '@tabler/icons-react'
import { useState } from 'react'
import { SettingsAccountTab } from './SettingsAccountTab'
import { SettingsAgentsTab } from './SettingsAgentsTab'
import { SettingsGeneralTab } from './SettingsGeneralTab'
import { SettingsSyncTab } from './SettingsSyncTab'

const TABS = [
  {
    key: 'general',
    label: 'General',
    icon: IconAdjustmentsHorizontal,
    desc: 'Theme, files and editor behavior.',
  },
  { key: 'agents', label: 'Agents', icon: IconRobot, desc: 'How agents behave inside your vault.' },
  {
    key: 'sync',
    label: 'Sync & sharing',
    icon: IconRefresh,
    desc: 'Your server, encryption and who can see what.',
  },
  { key: 'account', label: 'Account', icon: IconUser, desc: 'You, your devices and recovery.' },
] as const

type SettingsTab = (typeof TABS)[number]['key']

export function SettingsView() {
  const [tab, setTab] = useState<SettingsTab>('general')
  const current = TABS.find((entry) => entry.key === tab) ?? TABS[0]

  return (
    <section className="mx-auto max-w-[680px] px-10 pt-11 pb-[60px]">
      <h1 className="mb-1 font-semibold text-2xl tracking-[-0.02em]">Settings</h1>
      <p className="mb-[22px] text-muted-foreground">{current.desc}</p>

      <div className="mb-[26px] flex gap-1 border-border border-b">
        {TABS.map(({ key, label, icon: Icon }) => (
          <button
            type="button"
            key={key}
            onClick={() => setTab(key)}
            className={`-mb-px flex h-9 items-center gap-[7px] border-b-2 px-3 font-medium text-[13px] ${
              tab === key
                ? 'border-primary text-foreground'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Icon className="size-3.5" />
            {label}
          </button>
        ))}
      </div>

      {tab === 'general' && <SettingsGeneralTab />}
      {tab === 'agents' && <SettingsAgentsTab />}
      {tab === 'sync' && <SettingsSyncTab />}
      {tab === 'account' && <SettingsAccountTab />}
    </section>
  )
}
