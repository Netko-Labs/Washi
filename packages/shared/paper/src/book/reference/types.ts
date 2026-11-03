import type { Limit, PropRow } from '../guide'

/** One primitive at a glance: what it is, where it goes, which props it takes (`*` required). */
export interface PrimitiveLine {
  name: string
  group: string
  summary: string
  children: string
  props: string
}

/** One primitive in full: its props in words, where it may sit, and a block that passes. */
export interface PrimitiveDetail {
  name: string
  group: string
  summary: string
  children: string
  within: string[]
  oncePerPage: boolean
  props: Omit<PropRow, 'styled'>[]
  example: string
  /** Other ways to write it that pass: a written Table, inline marks. */
  also?: string[]
  /** The page code above the markup the example needs, when it draws a component of the page. */
  code?: string
}

export interface WsxIndex {
  start: string
  writing: Limit[]
  looks: Record<string, readonly string[]>
  rules: Limit[]
  primitives: PrimitiveLine[]
  next: string
}

export interface WsxDetails {
  styled: string
  primitives: PrimitiveDetail[]
  unknown?: { name: string; nearest: string[] }[]
}
