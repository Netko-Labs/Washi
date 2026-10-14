import { type TabKey, useViewStore } from '@washi/ui'
import { useEffect } from 'react'

/** The URL is the truth: a route marks its tab open and active when it renders. */
export function useRouteTab(tab: TabKey) {
  useEffect(() => {
    if (useViewStore.getState().activeTab !== tab) useViewStore.getState().openTab(tab)
  }, [tab])
}
