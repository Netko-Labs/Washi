import type { z } from 'zod'

export type WsxValue =
  | string
  | number
  | boolean
  | null
  | WsxValue[]
  | { [key: string]: WsxValue }

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
}

export type WsxRegistry = Record<string, ComponentSpec>
