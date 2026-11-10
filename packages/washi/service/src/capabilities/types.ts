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
  /** Its answer is words to read as they are (Markdown), not a value to pass as JSON. */
  answersText?: boolean
  /** Its answer is a `ContentAnswer`: blocks a carrier hands on as they are — a picture to look at. */
  answersContent?: boolean
  run(input: unknown): Promise<unknown>
}

/** One block of an answer as MCP carries it: words, or a picture in base64. */
export type ContentBlock =
  | { type: 'text'; text: string }
  | { type: 'image'; data: string; mimeType: string }

/** What a capability that `answersContent` answers (D138). */
export interface ContentAnswer {
  content: ContentBlock[]
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
  /** Where a person opens a page, when the caller knows the server's address. */
  pageUrl?: (id: string) => string
}
