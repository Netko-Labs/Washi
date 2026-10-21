import type { TabKey } from '@washi/ui'

/** Every tab is an address: `/w/<workspace>`, `/inbox`, `/settings` or `/p/<page>`. */
export function pathFor(workspaceId: string, tab: TabKey | null): string {
  const base = `/w/${workspaceId}`
  if (!tab || tab === 'view:dashboard' || tab === 'view:daily') return base
  if (tab.startsWith('note:')) return `${base}/p/${tab.slice(5)}`
  return `${base}/${tab.slice(5)}`
}
