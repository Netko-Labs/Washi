import type { WsxElement } from '@washi/wsx'
import type { ReactNode } from 'react'
import type { BlockProps } from './style'

/** Code compiled for a sandbox: its JS, or why not, in words. */
export type CompiledScript = { ok: true; js: string } | { ok: false; error: string }

export type ProgramState =
  | { status: 'starting' }
  | { status: 'stopped'; reason: string }
  | { status: 'drawn'; root: WsxElement }

/** What a page's runs share: its sandbox, what it fetched, the page as it is now. */
export interface ProgramLive {
  sandbox: Sandbox | null
  title: string
  /** Query JSON → rows JSON; null while one is being fetched. */
  rows: Map<string, string | null>
  /** Table name → its spec JSON; null while fetched, `null` JSON when there is no such table. */
  tables: Map<string, string | null>
  /** The members JSON; null while fetched, undefined until asked. */
  members: string | null | undefined
  /** The reader JSON, the same way. */
  me: string | null | undefined
  /** Why a press stopped the page; it stays stopped until its code changes. */
  halted: string | null
  values: Record<string, string | number | boolean | null>
  set: (key: string, value: string | number | boolean | null) => void
}

/** What one run asked for that the host fetches after it, then draws again. */
export interface ProgramNeeds {
  queries: string[]
  tables: string[]
  members: boolean
  me: boolean
  /** The first write the page tried while it drew, refused; the run stops on it. */
  refused: string | null
  /** The shortest clock the page set, in ms; 0 when none. */
  every: number
  /** Keys the page read with `usePageState(key, initial)` while unset: written once it has drawn. */
  seeds: Record<string, string | number | boolean | null>
}

export interface PageProgramProps {
  root: WsxElement
  draw: (root: WsxElement) => ReactNode
}

/** A drawn element as the sandbox hands it over: plain JSON, every part still unchecked. */
export interface DrawnNode {
  name?: unknown
  props?: unknown
  children?: unknown
}

/** A function prop the sandbox kept, by its place in the run's handler list. */
export interface DrawnHandler {
  washiHandler: number
}

/** Named ways out of a sandbox, lent per call; each answers with JSON text, or nothing. */
export type SandboxBridge = Record<string, (...args: string[]) => unknown>

export interface SandboxSetup {
  prelude: string
  /** Each is lent as `__bridge_<name>`. */
  names: string[]
  deadlineMs: number
  memoryBytes: number
}

/** One sandbox: a run gives JSON text or the error, in words. */
export interface Sandbox {
  call(
    code: string,
    bridge: SandboxBridge | null,
  ): { ok: true; value: string } | { ok: false; error: string }
  dispose(): void
}

export interface WidgetProps extends BlockProps {
  title?: string
  height?: number
  /** The HTML, the Widget's own text. */
  source: string
}

/** What a widget's frame may say to the page: nothing else is heard. */
export type WidgetMessage =
  | { type: 'height'; value: number }
  | { type: 'rows'; id: number; query: unknown }
  | { type: 'set'; key: string; value: unknown }
  | { type: 'act'; action: unknown }

export type WidgetGate = 'asking' | 'off' | 'on'

export interface FormulaProps extends BlockProps {
  name: string
  title?: string
}

export interface AutomationProps extends BlockProps {
  table: string
  on: 'insert' | 'update'
  title?: string
}
