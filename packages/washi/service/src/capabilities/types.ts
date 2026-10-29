import type { Member, Viewer } from '@washi/domain'
import type { z } from 'zod'

/**
 * One thing an agent may do, whatever carries it — Washi's Claude or AI SDK port, or an outside
 * agent over MCP. The input is checked here; the port only names it.
 */
export interface Capability {
  name: string
  description: string
  input: z.ZodRawShape
  isReadOnly: boolean
  run(input: unknown): Promise<unknown>
}

export interface CapabilityContext {
  /** Who reads: pages they cannot open do not exist for the call (D65). */
  viewer: Viewer
  /** Who a write is signed by: `washi`, or the member an outside agent acts for. */
  author: string
  /** Who is on the team — the control plane knows; the workspace file does not. */
  listPeople?: () => Promise<Member[]>
  /** A page just made is the page the person wants to look at. */
  onCreate?: (id: string) => void
}
