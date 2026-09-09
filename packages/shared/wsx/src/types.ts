import type { z } from 'zod'

export type WsxValue = string | number | boolean | null | WsxValue[] | { [key: string]: WsxValue }

export interface WsxElement {
  kind: 'element'
  name: string
  props: Record<string, WsxValue>
  children: WsxNode[]
}

export interface WsxText {
  kind: 'text'
  value: string
}

export type WsxNode = WsxElement | WsxText

export interface Diagnostic {
  severity: 'error' | 'warning'
  message: string
  /** 1-based, when the parser can attribute the problem to a location. */
  line?: number
  column?: number
  /** Element path like Sheet > Callout, for schema-level diagnostics. */
  path?: string
}

export type ChildPolicy = 'none' | 'text' | 'nodes'

export interface ComponentSpec {
  props: z.ZodType
  children: ChildPolicy
  /** Unknown prop → the legal alternative, so errors teach instead of scold. */
  hints?: Record<string, string>
  /** At most one per sheet (Mascot, Timer). */
  unique?: boolean
  /** May not appear inside itself (Repeat, Filter). */
  noNest?: boolean
  /** Only legal inside one of these ancestors. */
  within?: string[]
}

export interface WsxRegistry {
  components: Record<string, ComponentSpec>
  /** Fallback hints for props no component declares (colour, style, onClick …). */
  hints?: Record<string, string>
  /** Complexity budget — over it is a prompt to split, not an error. */
  budget?: { nodes: number; binds: number; exprs: number }
}

export interface WsxMissing {
  kind: string
  reason: string
  path: string
}
