import {
  type FormulaCaller,
  formulaFunctions,
  setFormulaRunner,
  type Workspace,
} from '@washi/repository'
import { codeLimits } from '../server'
import { compileScript } from './compile'
import { engineNow } from './engine'
import { FORMULA_MEMORY_BYTES } from './values'

type Cell = string | number | boolean | null

const isCell = (value: unknown): value is Cell =>
  value === null || ['string', 'number', 'boolean'].includes(typeof value)

/**
 * One QuickJS for one query, every workspace function defined in it once; each call has its own
 * deadline. Pure by construction: nothing in it reaches rows, state or the network — values in,
 * a value out. Null until the engine has loaded, so those formulas read empty for that query.
 */
function openCaller(ws: Workspace): FormulaCaller | null {
  const quickjs = engineNow()
  const functions = formulaFunctions(ws)
  if (!quickjs || functions.length === 0) return null
  const { formulaMs } = codeLimits(ws)
  const runtime = quickjs.newRuntime()
  runtime.setMemoryLimit(FORMULA_MEMORY_BYTES)
  const vm = runtime.newContext()
  const defined = new Set<string>()
  for (const formula of functions) {
    const compiled = compileScript(formula.source, formula.name)
    if (!compiled.ok) continue
    const deadline = Date.now() + formulaMs
    runtime.setInterruptHandler(() => Date.now() > deadline)
    const result = vm.evalCode(compiled.js)
    if (result.error) {
      result.error.dispose()
      continue
    }
    result.value.dispose()
    defined.add(formula.name)
  }
  return {
    call: (name, args) => {
      if (!defined.has(name)) throw new Error(`no function named ${name}`)
      const deadline = Date.now() + formulaMs
      runtime.setInterruptHandler(() => Date.now() > deadline)
      const result = vm.evalCode(`JSON.stringify(${name}(...${JSON.stringify(args)}) ?? null)`)
      if (result.error) {
        result.error.dispose()
        throw new Error(`${name} failed`)
      }
      const value: unknown = JSON.parse(vm.getString(result.value) || 'null')
      result.value.dispose()
      if (!isCell(value)) throw new Error(`${name} returned something no cell holds`)
      return value
    },
    close: () => {
      vm.dispose()
      runtime.dispose()
    },
  }
}

/** The workspace's formulas may call its own functions from now on. */
export function installFormulaFunctions(ws: Workspace): () => void {
  engineNow()
  return setFormulaRunner(ws, () => openCaller(ws))
}
