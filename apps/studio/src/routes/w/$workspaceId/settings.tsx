import { createFileRoute } from '@tanstack/react-router'
import { SETTINGS_TAB_KEYS, type SettingsTab } from '@/components/settings'
import { SettingsView } from '@/components/views'

const isTab = (value: unknown): value is SettingsTab =>
  SETTINGS_TAB_KEYS.some((key) => key === value)

export const Route = createFileRoute('/w/$workspaceId/settings')({
  ssr: false,
  // `agent` was one tab before the sections split; an old link lands on its first part.
  validateSearch: (search: Record<string, unknown>): { tab: SettingsTab } => ({
    tab: isTab(search.tab) ? search.tab : search.tab === 'agent' ? 'models' : 'profile',
  }),
  component: SettingsView,
})
