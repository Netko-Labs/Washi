import type { McpSession, McpWorkspaces } from '@washi/mcp'
import type { BootedRuntime } from '@washi/runtime'
import type { RUNTIME } from './constants'

export type RuntimeHolder = typeof globalThis & { [RUNTIME]?: Promise<BootedRuntime> }

/** Why an upload is refused, and the status that says so. */
export interface FileRefusal {
  error: string
  status: 400 | 413 | 415
}

/** Nitro route rules by pattern, headers only. */
export type HeaderRules = Record<string, { headers: Record<string, string> }>

/** The booted runtime itself, as the MCP route opens a workspace through it. */
export type Runtime = BootedRuntime['runtime']

/** One MCP request's answer to who and where: a session, and every workspace it reaches (D124). */
export interface McpAnswer {
  session: McpSession
  workspaces?: McpWorkspaces
}
