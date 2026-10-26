import { ACTIVE_WORKSPACE_KEY, TRPC_WS_PATH } from './constants'

/** Same-origin WebSocket URL, so the browser sends the session cookie on the upgrade. */
export function getWebSocketUrl(): string {
  const protocol = window.location.protocol === 'https:' ? 'wss' : 'ws'
  return `${protocol}://${window.location.host}${TRPC_WS_PATH}`
}

export function readActiveWorkspace(): string | null {
  if (typeof window === 'undefined') return null
  try {
    return localStorage.getItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    return null
  }
}

export function writeActiveWorkspace(id: string | null): void {
  try {
    if (id) localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
    else localStorage.removeItem(ACTIVE_WORKSPACE_KEY)
  } catch {
    // private mode: requests fall back to the server's default workspace
  }
}

/** An upload's bytes, read back through the files route with its workspace named. */
export function fileUrl(id: string, workspaceId: string): string {
  return `/api/files/${id}?workspace=${encodeURIComponent(workspaceId)}`
}
