import type { ThemeId } from '@washi/paper/registry'
import type { WsxValue } from '@washi/wsx'

export type Mode = 'light' | 'dark'
export type Feel = 'note' | 'editorial' | 'board' | 'deck'
export type Accent = 'accent' | 'info' | 'success' | 'warning' | 'danger'
export type Width = '320' | '400' | '720' | 'full'
export type View = 'single' | 'matrix' | 'scratch'

export interface Frame {
  theme: ThemeId
  mode: Mode
  feel: Feel
  accent: Accent
  width: Width
}

export interface BookState extends Frame {
  primitive: string
  knobs: Record<string, WsxValue>
  childrenText: string | null
  view: View
  scratch: string | null
  query: string
}

export interface BookActions {
  pick(primitive: string): void
  setKnob(key: string, value: WsxValue | undefined): void
  setChildren(text: string | null): void
  setScratch(source: string | null): void
  set(patch: Partial<Frame & { view: View; query: string }>): void
  reset(): void
}

export type BookStore = BookState & BookActions
