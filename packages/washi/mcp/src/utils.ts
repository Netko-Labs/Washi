import type { ContentAnswer } from '@washi/service'
import type { McpWorkspace } from './types'

/** A capability's answer that is MCP content blocks already (file_get's picture, D138). */
export const isContentAnswer = (value: unknown): value is ContentAnswer =>
  typeof value === 'object' &&
  value !== null &&
  Array.isArray((value as { content?: unknown }).content)

/** The workspace a call names — its id, or its name in any case — or null when it is none of them. */
export function workspaceNamed(list: McpWorkspace[], ref: string): McpWorkspace | null {
  const wanted = ref.trim().toLowerCase()
  return (
    list.find((each) => each.id === ref.trim()) ??
    list.find((each) => each.name.trim().toLowerCase() === wanted) ??
    null
  )
}

/** Said when a call names a workspace this sign-in does not reach: which ones it does. */
export const notAWorkspace = (ref: string, list: McpWorkspace[]) =>
  `"${ref}" is not a workspace you can work in here — you can: ${list
    .map((each) => `${each.name} (${each.id})`)
    .join(', ')}. workspace_list names them.`
