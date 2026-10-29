import type * as t from '@babel/types'
import { splitPage } from './split'

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

/**
 * A page as an ES module: its imports, functions and exports at the top; every other statement and
 * the markup become `export default function view()`, run on each draw — so a hook written at the
 * page's top level is called where hooks are.
 */
export function pageModule(source: string): string {
  const { code, markup } = splitPage(source)
  const top: string[] = []
  const body: string[] = []
  for (const statement of code?.statements ?? []) {
    const text = code?.text.slice(statement.start ?? 0, statement.end ?? 0) ?? ''
    ;(HOISTED.has(statement.type) ? top : body).push(text)
  }
  return [...top, 'export default function view() {', ...body, `return (\n${markup}\n)`, '}'].join(
    '\n',
  )
}
