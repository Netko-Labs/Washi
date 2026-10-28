import type { ScriptEntry } from './types'

/** Which primitive runs which entry; a Formula's entry is its own name. */
export const ENTRIES: Record<string, ScriptEntry> = { Script: 'view', Automation: 'run' }

export const ENTRY_WORDS: Record<string, string> = {
  view: 'a script needs a function view() that returns what it draws',
  run: 'an automation needs a function run(event) that says what to do',
}

/** An automation's run, and how much it may ask for: past these it is stopped, nothing applied. */
export const AUTOMATION_DEADLINE_MS = 100
export const AUTOMATION_MEMORY_BYTES = 16 * 1024 * 1024
export const AUTOMATION_MAX_ACTIONS = 50
/** A formula function's whole budget per call — it runs once per row, so it must be quick. */
export const FORMULA_DEADLINE_MS = 20
export const FORMULA_MEMORY_BYTES = 16 * 1024 * 1024

/** How many compiled automations the server keeps at once. */
export const COMPILED_KEPT = 64

/** The author an automation's writes carry; a write signed so never runs automations itself. */
export const AUTOMATION_AUTHOR = 'automation'

/** What an automation runs on: rows it may read now, actions it collects, the clock. */
export const AUTOMATION_PRELUDE = `
const __actions = []
globalThis.rows = (query) => JSON.parse(__bridge_rows(JSON.stringify(query)))
globalThis.act = (action) => { __actions.push(action) }
globalThis.now = () => Date.now()
globalThis.__run = (event) => { run(JSON.parse(event)); return JSON.stringify(__actions) }
`
