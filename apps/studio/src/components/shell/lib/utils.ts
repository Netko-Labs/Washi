import type { TabKey } from '@washi/ui'
import { TABS_KEY_PREFIX } from '@/lib/constants'

/** Every tab is an address: `/w/<workspace>`, `/inbox`, `/settings` or `/p/<page>`. */
export function pathFor(workspaceId: string, tab: TabKey | null): string {
  const base = `/w/${workspaceId}`
  if (!tab || tab === 'view:dashboard' || tab === 'view:daily') return base
  if (tab.startsWith('note:')) return `${base}/p/${tab.slice(5)}`
  return `${base}/${tab.slice(5)}`
}

export function savedTabs(workspaceId: string): TabKey[] {
  try {
    const raw = localStorage.getItem(TABS_KEY_PREFIX + workspaceId)
    const parsed: unknown = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed)
      ? parsed.filter((tab): tab is TabKey => typeof tab === 'string' && /^(note|view):/.test(tab))
      : []
  } catch {
    return []
  }
}

export function saveTabs(workspaceId: string, tabs: TabKey[]): void {
  try {
    localStorage.setItem(TABS_KEY_PREFIX + workspaceId, JSON.stringify(tabs))
  } catch {
    // private mode: the strip lasts the visit
  }
}
