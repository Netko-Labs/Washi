import type { TabKey } from '@washi/ui'
import { DOCK_KEY_PREFIX, FOLD_KEY_PREFIX } from './constants'

/** Every tab is an address: `/w/<workspace>`, `/inbox`, `/settings` or `/p/<page>`. */
export function pathFor(workspaceId: string, tab: TabKey | null): string {
  const base = `/w/${workspaceId}`
  if (!tab || tab === 'view:dashboard' || tab === 'view:daily') return base
  if (tab.startsWith('note:')) return `${base}/p/${tab.slice(5)}`
  return `${base}/${tab.slice(5)}`
}

/** A chat's page is under its view's address (`/chats/<id>` under `/chats`); Home is under nothing. */
export function isWithin(pathname: string, target: string, workspaceId: string): boolean {
  if (pathname === target) return true
  return target !== `/w/${workspaceId}` && pathname.startsWith(`${target}/`)
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

/** Docked unless this workspace was undocked: the side panel is Washi's default room. */
export function readDock(workspaceId: string): boolean {
  try {
    return localStorage.getItem(DOCK_KEY_PREFIX + workspaceId) !== '0'
  } catch {
    return true
  }
}

export function writeDock(workspaceId: string, docked: boolean): void {
  try {
    if (docked) localStorage.removeItem(DOCK_KEY_PREFIX + workspaceId)
    else localStorage.setItem(DOCK_KEY_PREFIX + workspaceId, '0')
  } catch {
    // private mode: the dock lasts the visit
  }
}
