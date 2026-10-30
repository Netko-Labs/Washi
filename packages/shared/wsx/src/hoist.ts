import type * as t from '@babel/types'
import type { Acting, HoistCandidate } from './types'

const FUNCTION = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'])
/** What does something the moment the module loads: a call, a construction, a change. */
const ACTING = new Set([
  'CallExpression',
  'NewExpression',
  'TaggedTemplateExpression',
  'AwaitExpression',
  'YieldExpression',
  'AssignmentExpression',
  'UpdateExpression',
])
/** Of those, what only computes: run once at load, it gives what each draw would. */
const COMPUTING = new Set(['CallExpression', 'NewExpression', 'TaggedTemplateExpression'])
const SKIPPED = new Set(['loc', 'leadingComments', 'trailingComments', 'innerComments', 'extra'])
const HOOK = /^use[A-Z]/
/** Statements the module keeps at its top whatever they read: what it defines or lends. */
const TOP = new Set<t.Statement['type']>([
  'ExportNamedDeclaration',
  'FunctionDeclaration',
  'ClassDeclaration',
])
const RANK: Record<Acting, number> = { none: 0, computes: 1, changes: 2 }

const worse = (a: Acting, b: Acting): Acting => (RANK[a] >= RANK[b] ? a : b)

type Walked = Record<string, unknown> & { type?: string }

/** Every name the node reads, and what it does outside a function of its own. */
function survey(node: unknown, names: Set<string>, inFunction: boolean): Acting {
  if (!node || typeof node !== 'object') return 'none'
  if (Array.isArray(node))
    return node.reduce<Acting>((acts, item) => worse(survey(item, names, inFunction), acts), 'none')
  const each = node as Walked
  if (each.type === 'Identifier') names.add(String(each.name))
  const nested = inFunction || (each.type !== undefined && FUNCTION.has(each.type))
  let acts: Acting = 'none'
  if (!inFunction && each.type !== undefined && ACTING.has(each.type))
    acts = COMPUTING.has(each.type) ? 'computes' : 'changes'
  for (const [key, value] of Object.entries(each)) {
    if (SKIPPED.has(key) || !value || typeof value !== 'object') continue
    // `a.b` and `{ b: 1 }` name no variable `b`.
    const isKey = (key === 'property' || key === 'key') && !each.computed
    if (isKey) continue
    acts = worse(survey(value, names, nested), acts)
  }
  return acts
}

/** The names a binding pattern declares: `a`, `[a, , ...b]`, `{ a, b: { c = 1 }, ...d }`. */
function bound(pattern: t.Node | null | undefined): string[] {
  if (!pattern) return []
  if (pattern.type === 'Identifier') return [pattern.name]
  if (pattern.type === 'ArrayPattern') return pattern.elements.flatMap((each) => bound(each))
  if (pattern.type === 'ObjectPattern')
    return pattern.properties.flatMap((each) =>
      each.type === 'RestElement' ? bound(each.argument) : bound(each.value),
    )
  if (pattern.type === 'AssignmentPattern') return bound(pattern.left)
  if (pattern.type === 'RestElement') return bound(pattern.argument)
  return []
}

function declared(statement: t.Statement | null | undefined): string[] {
  if (statement?.type === 'FunctionDeclaration') return statement.id ? [statement.id.name] : []
  if (statement?.type !== 'VariableDeclaration') return []
  return statement.declarations.flatMap((each) => bound(each.id))
}

const readsAny = (reads: Set<string>, names: Set<string>) =>
  [...reads].some((name) => names.has(name))

/** What `washi` lends (`act` and aliases too), and every top-level name whose code reaches one. */
function hookNames(statements: t.Statement[]): Set<string> {
  const hooks = new Set<string>()
  const units: { names: string[]; reads: Set<string> }[] = []
  for (const statement of statements) {
    if (statement.type === 'ImportDeclaration') {
      if (statement.source.value === 'washi')
        for (const each of statement.specifiers) hooks.add(each.local.name)
      continue
    }
    const inner = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    const reads = new Set<string>()
    survey(inner, reads, false)
    units.push({ names: declared(inner), reads })
  }
  let isSettled = false
  while (!isSettled) {
    isSettled = true
    for (const { names, reads } of units) {
      const reaches = [...reads].some((name) => HOOK.test(name) || hooks.has(name))
      if (!reaches || names.every((name) => hooks.has(name))) continue
      for (const name of names) hooks.add(name)
      isSettled = false
    }
  }
  return hooks
}

/** A constant that computes is kept only as far as the top, or a constant kept, reads it. */
function readFromTop(
  statements: t.Statement[],
  candidates: Map<t.Statement, HoistCandidate>,
): Set<t.Statement> {
  const needed = new Set<string>()
  for (const statement of statements) if (TOP.has(statement.type)) survey(statement, needed, false)
  const kept = new Set<t.Statement>()
  let isSettled = false
  while (!isSettled) {
    isSettled = true
    for (const [statement, { names, reads, acts }] of candidates) {
      if (kept.has(statement)) continue
      if (acts === 'computes' && !names.some((name) => needed.has(name))) continue
      kept.add(statement)
      for (const name of reads) needed.add(name)
      isSettled = false
    }
  }
  return kept
}

/**
 * A page's top-level `const`s that may live at the module's top, beside the functions that read
 * them: none reads a name only `view()` holds, and none changes anything as the module loads. One
 * that calls or constructs runs once at load instead of on each draw, so it moves only when the top
 * reads it, and never when it reaches a hook.
 */
export function moduleConstants(statements: t.Statement[]): Set<t.Statement> {
  const hooks = hookNames(statements)
  const candidates = new Map<t.Statement, HoistCandidate>()
  const viewNames = new Set<string>()
  for (const statement of statements) {
    if (statement.type !== 'VariableDeclaration') continue
    const reads = new Set<string>()
    const acts = statement.declarations.reduce<Acting>(
      (sum, each) => worse(survey(each.init, reads, false), sum),
      'none',
    )
    const isHooked =
      acts !== 'none' && [...reads].some((name) => HOOK.test(name) || hooks.has(name))
    const names = declared(statement)
    if (statement.kind === 'const' && acts !== 'changes' && !isHooked)
      candidates.set(statement, { names, reads, acts })
    else for (const name of names) viewNames.add(name)
  }
  // A constant reading one that stays in `view()` stays there too, until nothing more moves.
  let isSettled = false
  while (!isSettled) {
    isSettled = true
    for (const [statement, { names, reads }] of candidates) {
      if (readsAny(reads, viewNames)) {
        candidates.delete(statement)
        for (const name of names) viewNames.add(name)
        isSettled = false
      }
    }
  }
  return readFromTop(statements, candidates)
}
