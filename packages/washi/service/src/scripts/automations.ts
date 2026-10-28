import { checkAction } from '@washi/hanko'
import {
  automationsFor,
  onRecordWrite,
  type RecordWrite,
  recordCapability,
  type StoredAutomation,
  tableNameOf,
  type Workspace,
} from '@washi/repository'
import type { QuickJSWASMModule } from 'quickjs-emscripten-core'
import { deleteRecord, runMutation, runQuery, updateRecord } from '../tables/service'
import { compileScript } from './compile'
import type { AutomationEvent, AutomationRun, CompiledScript } from './types'
import {
  AUTOMATION_AUTHOR,
  AUTOMATION_DEADLINE_MS,
  AUTOMATION_MAX_ACTIONS,
  AUTOMATION_MEMORY_BYTES,
  AUTOMATION_PRELUDE,
  COMPILED_KEPT,
} from './values'

let engine: Promise<QuickJSWASMModule> | null = null

function loadEngine(): Promise<QuickJSWASMModule> {
  if (!engine) {
    const loading = Promise.all([
      import('quickjs-emscripten-core'),
      import('@jitl/quickjs-singlefile-mjs-release-sync'),
    ]).then(([core, variant]) => core.newQuickJSWASMModuleFromVariant(variant.default))
    engine = loading
    loading.catch(() => {
      if (engine === loading) engine = null
    })
  }
  return engine
}

const compiled = new Map<string, CompiledScript>()

/** Compiled once per source; the oldest goes when the cache is full, so editing never grows it forever. */
function compileOnce(source: string): CompiledScript {
  const found = compiled.get(source)
  if (found) return found
  const made = compileScript(source, 'run')
  if (compiled.size >= COMPILED_KEPT) {
    const oldest = compiled.keys().next().value
    if (oldest !== undefined) compiled.delete(oldest)
  }
  compiled.set(source, made)
  return made
}

/**
 * One automation over one write, in a fresh QuickJS: `rows(query)` reads the workspace now, `act`
 * collects what it wants done. Nothing is applied here — a run that throws or overruns does nothing.
 */
export async function runAutomation(
  ws: Workspace,
  source: string,
  event: AutomationEvent,
): Promise<AutomationRun> {
  const script = compileOnce(source)
  if (!script.ok) return { ok: false, error: script.error }
  const quickjs = await loadEngine()
  const runtime = quickjs.newRuntime()
  runtime.setMemoryLimit(AUTOMATION_MEMORY_BYTES)
  const vm = runtime.newContext()
  try {
    const rows = vm.newFunction('__bridge_rows', (query) => {
      const result = runQuery(ws, JSON.parse(vm.getString(query)))
      return vm.newString(JSON.stringify(result.rows))
    })
    vm.setProp(vm.global, '__bridge_rows', rows)
    rows.dispose()
    const deadline = Date.now() + AUTOMATION_DEADLINE_MS
    runtime.setInterruptHandler(() => Date.now() > deadline)
    const code = `${AUTOMATION_PRELUDE}\n${script.js}\n__run(${JSON.stringify(JSON.stringify(event))})`
    const result = vm.evalCode(code)
    if (result.error) {
      const failure = vm.dump(result.error) as { message?: string } | string
      result.error.dispose()
      const message = typeof failure === 'string' ? failure : (failure.message ?? 'it threw')
      return {
        ok: false,
        error: message === 'interrupted' ? `ran past ${AUTOMATION_DEADLINE_MS} ms` : message,
      }
    }
    const actions = JSON.parse(vm.getString(result.value)) as Record<string, unknown>[]
    result.value.dispose()
    if (actions.length > AUTOMATION_MAX_ACTIONS) {
      return {
        ok: false,
        error: `asked for ${actions.length} actions — at most ${AUTOMATION_MAX_ACTIONS}`,
      }
    }
    return { ok: true, actions }
  } finally {
    vm.dispose()
    runtime.dispose()
  }
}

/** An automation inserts, updates or deletes rows — signed `automation`, so it never fires another. */
function apply(ws: Workspace, input: Record<string, unknown>): void {
  const checked = checkAction(input)
  if (!checked.ok) throw new Error(checked.issues.map((issue) => issue.message).join('; '))
  const action = checked.action
  switch (action.verb) {
    case 'table.insert':
      runMutation(ws, { kind: 'insert', table: action.table, data: action.data }, AUTOMATION_AUTHOR)
      return
    case 'table.update':
      updateRecord(ws, action.table, action.row, action.set, AUTOMATION_AUTHOR)
      return
    case 'table.delete':
      deleteRecord(ws, action.table, action.row, AUTOMATION_AUTHOR)
      return
    default:
      throw new Error(`an automation inserts, updates or deletes rows — not ${action.verb}`)
  }
}

async function fireOne(ws: Workspace, automation: StoredAutomation, event: AutomationEvent) {
  const run = await runAutomation(ws, automation.source, event)
  let applied = 0
  let error = run.ok ? null : run.error
  if (run.ok) {
    // All of it or none: one action that fails takes back the ones before it.
    try {
      ws.sqlite.transaction(() => {
        for (const action of run.actions) apply(ws, action)
      })()
      applied = run.actions.length
    } catch (cause) {
      error = cause instanceof Error ? cause.message : String(cause)
    }
  }
  recordCapability(ws, {
    origin: 'sheet',
    subject: 'automation',
    input: {
      sheet: automation.sheetId,
      title: automation.title,
      table: event.table,
      on: event.kind,
      applied,
    },
    decision: error ? 'denied' : 'auto',
    detail: error ?? undefined,
  })
  return applied
}

/**
 * Every row write a person, a page or Washi lands runs the live automations listening on its table,
 * once the write is done. `onApplied` hears when one changed rows, so open pages refetch.
 */
export function watchAutomations(ws: Workspace, onApplied: () => void): () => void {
  return onRecordWrite(ws, (write: RecordWrite) => {
    if (write.author === AUTOMATION_AUTHOR) return
    queueMicrotask(() => {
      void (async () => {
        const table = tableNameOf(ws, write.tableId)
        if (!table) return
        const event: AutomationEvent = {
          table,
          kind: write.kind,
          row: { ...write.data, id: write.recordId },
          before: write.before,
        }
        let changed = 0
        for (const automation of automationsFor(ws, table, write.kind)) {
          changed += await fireOne(ws, automation, event)
        }
        if (changed > 0) onApplied()
      })().catch(() => {
        // A closed workspace or a vanished table: the write stands, the automation simply missed it.
      })
    })
  })
}
