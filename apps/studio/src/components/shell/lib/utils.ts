import type { TabKey } from '@washi/ui'
import { DOCK_KEY_PREFIX, FOLD_KEY_PREFIX } from './constants'

/** Every tab is an address: `/w/<workspace>`, `/inbox`, `/settings` or `/p/<page>`. */
export function pathFor(workspaceId: string, tab: TabKey | null): string {
  const base = `/w/${workspaceId}`
  if (!tab || tab === 'view:dashboard' || tab === 'view:daily') return base
  if (tab.startsWith('note:')) return `${base}/p/${tab.slice(5)}`
  return `${base}/${tab.slice(5)}`
}

export function readFold(workspaceId: string): boolean {
  try {
    return localStorage.getItem(FOLD_KEY_PREFIX + workspaceId) === '1'
  } catch {
    return false
  }
}

export function writeFold(workspaceId: string, folded: boolean): void {
  try {
    if (folded) localStorage.setItem(FOLD_KEY_PREFIX + workspaceId, '1')
    else localStorage.removeItem(FOLD_KEY_PREFIX + workspaceId)
  } catch {
    // private mode: the fold lasts the visit
  }
}

export function readDock(workspaceId: string): boolean {
  try {
    return localStorage.getItem(DOCK_KEY_PREFIX + workspaceId) === '1'
  } catch {
    return false
  }
}

export function writeDock(workspaceId: string, docked: boolean): void {
  try {
    if (docked) localStorage.setItem(DOCK_KEY_PREFIX + workspaceId, '1')
    else localStorage.removeItem(DOCK_KEY_PREFIX + workspaceId)
  } catch {
    // private mode: the dock lasts the visit
  }
}
