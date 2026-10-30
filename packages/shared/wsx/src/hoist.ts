import type * as t from '@babel/types'

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
const SKIPPED = new Set(['loc', 'leadingComments', 'trailingComments', 'innerComments', 'extra'])

type Walked = Record<string, unknown> & { type?: string }

/** Every name the node reads, and whether it acts outside a function of its own. */
function survey(node: unknown, names: Set<string>, inFunction: boolean): boolean {
  if (!node || typeof node !== 'object') return false
  if (Array.isArray(node))
    return node.reduce((acts, item) => survey(item, names, inFunction) || acts, false)
  const each = node as Walked
  if (each.type === 'Identifier') names.add(String(each.name))
  const nested = inFunction || (each.type !== undefined && FUNCTION.has(each.type))
  let acts = !inFunction && each.type !== undefined && ACTING.has(each.type)
  for (const [key, value] of Object.entries(each)) {
    if (SKIPPED.has(key) || !value || typeof value !== 'object') continue
    // `a.b` and `{ b: 1 }` name no variable `b`.
    const isKey = (key === 'property' || key === 'key') && !each.computed
    if (isKey) continue
    acts = survey(value, names, nested) || acts
  }
  return acts
}

function declared(statement: t.Statement): string[] {
  if (statement.type !== 'VariableDeclaration') return []
  return statement.declarations.flatMap((each) =>
    each.id.type === 'Identifier' ? [each.id.name] : [],
  )
}

/**
 * A page's top-level `const`s that may live at the module's top, beside the functions that read
 * them: nothing in them runs as the module loads, and none reads a name only `view()` holds.
 */
export function moduleConstants(statements: t.Statement[]): Set<t.Statement> {
  const candidates = new Map<t.Statement, Set<string>>()
  const viewNames = new Set<string>()
  for (const statement of statements) {
    if (statement.type !== 'VariableDeclaration') continue
    const isPlain =
      statement.kind === 'const' &&
      statement.declarations.every((each) => each.id.type === 'Identifier')
    const reads = new Set<string>()
    const acts = statement.declarations.some((each) => survey(each.init, reads, false))
    if (isPlain && !acts) candidates.set(statement, reads)
    else for (const name of declared(statement)) viewNames.add(name)
  }
  // A constant reading one that stays in `view()` stays there too, until nothing more moves.
  let isSettled = false
  while (!isSettled) {
    isSettled = true
    for (const [statement, reads] of candidates) {
      if ([...reads].some((name) => viewNames.has(name))) {
        candidates.delete(statement)
        for (const name of declared(statement)) viewNames.add(name)
        isSettled = false
      }
    }
  }
  return new Set(candidates.keys())
}
