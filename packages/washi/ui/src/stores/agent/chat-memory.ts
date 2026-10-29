import { CHAT_KEY_PREFIX, HOME_SCOPE_KEY } from './constants'
import type { ChatScope } from './types'

const keyOf = (workspaceKey: string, scope: ChatScope) =>
  `${CHAT_KEY_PREFIX}${workspaceKey}:${scope ?? HOME_SCOPE_KEY}`

/** Browser storage, read only when asked: the studio imports this store on the server. */
export function rememberedChat(workspaceKey: string | null, scope: ChatScope): string | null {
  if (!workspaceKey) return null
  try {
    return localStorage.getItem(keyOf(workspaceKey, scope))
  } catch {
    return null
  }
}

export function rememberChat(workspaceKey: string | null, scope: ChatScope, id: string): void {
  if (!workspaceKey) return
  try {
    localStorage.setItem(keyOf(workspaceKey, scope), id)
  } catch {
    // private mode: the choice lasts the visit
  }
}
