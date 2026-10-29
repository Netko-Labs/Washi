import { useAgentStore, useLiveStore, useSheetsStore, useThemesStore } from '@washi/ui'
import { useEffect } from 'react'
import { subscribeDevCommands } from '@/lib/dev-commands'

export function useAppBoot(): void {
  const refresh = useSheetsStore((state) => state.refresh)

  useEffect(() => {
    void refresh()
    void useThemesStore.getState().refresh()
    subscribeDevCommands()
    // From boot, not from the panel: the inbox badge and Inbox need live approvals
    // whether or not the panel was ever opened.
    void useAgentStore.getState().init()
    useLiveStore.getState().connect()
  }, [refresh])
}
