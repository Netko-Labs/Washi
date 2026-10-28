/** TSX compiled for the sandbox, or why not, in words. */
export type CompiledScript = { ok: true; js: string } | { ok: false; error: string }

/** A `<Script>` found on a page: where it sits and the TSX it holds. */
export interface FoundScript {
  path: string
  /** `view`, `run`, or a Formula's own name. */
  entry: string
  source: string
}

/** The function a script must name: what a page draws, or what a row write runs. */
export type ScriptEntry = 'view' | 'run'

/** A row write, as an automation's `run(event)` receives it. */
export interface AutomationEvent {
  table: string
  kind: 'insert' | 'update'
  row: Record<string, unknown> & { id: string }
  before: Record<string, unknown> | null
}

/** What one automation run did: the actions it asked for, or why it stopped. */
export type AutomationRun =
  | { ok: true; actions: Record<string, unknown>[] }
  | { ok: false; error: string }
