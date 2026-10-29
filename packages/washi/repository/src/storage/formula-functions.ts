import { processSingleton } from '@washi/domain'
import type { Workspace } from './client'

/** A workspace function, called with a formula's evaluated arguments. */
export type FormulaCall = (
  name: string,
  args: (string | number | boolean | null)[],
) => string | number | boolean | null

/** One query's worth of calls; `close` frees whatever ran them. */
export interface FormulaCaller {
  call: FormulaCall
  close(): void
}

export interface StoredFormula {
  name: string
  source: string
}

// Callbacks, not data: who runs a workspace's own formula functions, set once per open workspace.
const openers = processSingleton(
  'formula-runners',
  () => new WeakMap<Workspace, () => FormulaCaller | null>(),
)

export function setFormulaRunner(ws: Workspace, open: () => FormulaCaller | null): () => void {
  openers.set(ws, open)
  return () => openers.delete(ws)
}

/** A caller for one query, or null where nothing runs them — their formulas then read as empty. */
export function openFormulaCaller(ws: Workspace): FormulaCaller | null {
  return openers.get(ws)?.() ?? null
}

/** The functions live pages define, one per name — the first page to name it keeps it. */
export function formulaFunctions(ws: Workspace): StoredFormula[] {
  const rows = ws.sqlite
    .query(
      `SELECT f.name, f.source FROM sheet_formulas f JOIN sheets s ON s.id = f.src
       WHERE s.deleted_at IS NULL ORDER BY s.hlc_created, f.position`,
    )
    .all() as StoredFormula[]
  const seen = new Set<string>()
  return rows.filter((row) => !seen.has(row.name) && seen.add(row.name))
}
