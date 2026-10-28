import type { ChildPolicy, WsxElement } from '@washi/wsx'

export interface Recipe {
  id: string
  title: string
  /** What the combination is for, in one line. */
  why: string
  /** The primitives it leans on, so a reader can jump to each. */
  uses: string[]
  source: string
}

export interface Limit {
  title: string
  detail: string
}

export interface PropRow {
  key: string
  /** The legal values in words: `week · month`, `number 1–12`, `text ≤ 40`. */
  type: string
  required: boolean
  /** One of the four enums or the layout tokens every primitive takes. */
  styled: boolean
}

export interface Placement {
  children: ChildPolicy
  within: string[]
  unique: boolean
  noNest: boolean
}

export interface CompiledSheet {
  root: WsxElement | null
  errors: string[]
}
