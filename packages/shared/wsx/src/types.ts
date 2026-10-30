import type * as t from '@babel/types'
import type { z } from 'zod'

export type WsxValue = string | number | boolean | null | WsxValue[] | { [key: string]: WsxValue }

export interface WsxElement {
  kind: 'element'
  name: string
  props: Record<string, WsxValue>
  children: WsxNode[]
  /** Props written as code (`count={rows.length}`), by name → the expression's source. */
  code?: Record<string, string>
  /** On the root of a page that runs: its imports and code, above the markup. */
  prelude?: WsxPrelude
}

/** A page's code above its markup (D100). */
export interface WsxPrelude {
  source: string
  /** Capitalized names it binds — the page's own components, drawn as tags. */
  components: string[]
}

/** A `{…}` hole in the markup: code the page runs to fill it. */
export interface WsxCode {
  kind: 'code'
  source: string
}

export interface WsxText {
  kind: 'text'
  value: string
}

export type WsxNode = WsxElement | WsxText | WsxCode

export interface Diagnostic {
  severity: 'error' | 'warning'
  message: string
  /** 1-based, when the parser can attribute the problem to a location. */
  line?: number
  column?: number
  /** Element path like Sheet > Callout, for schema-level diagnostics. */
  path?: string
}

/** `component`: exactly one element naming one of the page's own components (a Widget's). */
export type ChildPolicy = 'none' | 'text' | 'nodes' | 'component'

export interface ComponentSpec {
  props: z.ZodType
  children: ChildPolicy
  /** What a broken `component` policy says, when the default would not teach. */
  childWords?: string
  /** Unknown prop → the legal alternative, so errors teach instead of scold. */
  hints?: Record<string, string>
  /** At most one per sheet (Mascot, Timer). */
  unique?: boolean
  /** May not appear inside itself (Repeat, Filter). */
  noNest?: boolean
  /** Only legal inside one of these ancestors. */
  within?: string[]
  /** Props checked instead when the nearest `within` ancestor is this one. */
  propsWithin?: Record<string, z.ZodType>
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

/** A page cut where its markup starts; `statements` are positioned in `code.text`. */
export interface PageSplit {
  code: { text: string; statements: t.Statement[] } | null
  markup: string
  lineOffset: number
}

/** An AST node's own text in the source it was parsed from. */
export type Slice = (node: t.Node) => string
