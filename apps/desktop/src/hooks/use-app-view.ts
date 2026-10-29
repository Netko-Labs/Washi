import { useAgentStore, useViewStore, viewOf } from '@washi/ui'
import { useProfileStore } from '@/stores/profile'

export function useAppView() {
  const panelOpen = useAgentStore((state) => state.panelOpen)
  const activeTab = useViewStore((state) => state.activeTab)
  const onboarding = useProfileStore((state) => state.onboarding)
  return { panelOpen, view: viewOf(activeTab), onboarding }
}
