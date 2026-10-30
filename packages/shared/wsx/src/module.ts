import type * as t from '@babel/types'
import { moduleConstants } from './hoist'
import { splitPage } from './split'
import { widgetsAsNodes } from './widget'

/** What a page's module keeps at its top: what it imports, defines, or lends to other pages. */
const HOISTED = new Set<t.Statement['type']>([
  'ImportDeclaration',
  'ExportNamedDeclaration',
  'ExportAllDeclaration',
  'FunctionDeclaration',
  'ClassDeclaration',
  'TSTypeAliasDeclaration',
  'TSInterfaceDeclaration',
  'TSEnumDeclaration',
])

const HOOK = /^use[A-Z]/
const FUNCTION = new Set(['ArrowFunctionExpression', 'FunctionExpression', 'FunctionDeclaration'])

/** Hooks a node calls outside any function of its own — what would run when the module loads. */
function hooksCalled(node: unknown, found: string[]): string[] {
  if (!node || typeof node !== 'object') return found
  const each = node as { type?: string; callee?: { type?: string; name?: string } }
  if (each.type && FUNCTION.has(each.type)) return found
  if (each.type === 'CallExpression' && each.callee?.type === 'Identifier') {
    if (HOOK.test(each.callee.name ?? '')) found.push(each.callee.name ?? '')
  }
  for (const [key, value] of Object.entries(node)) {
    if (key === 'loc' || key === 'leadingComments' || key === 'trailingComments') continue
    if (Array.isArray(value)) for (const item of value) hooksCalled(item, found)
    else hooksCalled(value, found)
  }
  return found
}

/**
 * Hooks an exported value calls at the page's top: hoisted out of `view()`, they would run once
 * as the bundle loads, never as the page draws.
 */
export function hoistedHookCalls(source: string): string[] {
  const { code } = splitPage(source)
  const hoisted = (code?.statements ?? []).filter(
    (statement) => statement.type === 'ExportNamedDeclaration',
  )
  return [...new Set(hoisted.flatMap((statement) => hooksCalled(statement, [])))]
}

/**
 * A page as an ES module: its imports, functions, exports and plain constants at the top (so a
 * helper reads the constants beside it); every other statement and the markup become
 * `export default function view()`, run on each draw — so a hook written at the page's top level is
 * called where hooks are. A Widget's component is left to its frame.
 */
export function pageModule(source: string): string {
  const { code, markup } = splitPage(source)
  const statements = code?.statements ?? []
  const constants = moduleConstants(statements)
  const top: string[] = []
  const body: string[] = []
  for (const statement of statements) {
    const text = code?.text.slice(statement.start ?? 0, statement.end ?? 0) ?? ''
    ;(HOISTED.has(statement.type) || constants.has(statement) ? top : body).push(text)
  }
  return widgetsAsNodes(
    [...top, 'export default function view() {', ...body, `return (\n${markup}\n)`, '}'].join('\n'),
  )
}
