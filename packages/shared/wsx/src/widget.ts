import { parse as parseProgram } from '@babel/parser'
import type * as t from '@babel/types'
import type { Diagnostic, WsxElement, WsxNode } from './types'

const WIDGET = 'Widget'
const COMPONENT = /^[A-Z]/
const INTRINSIC = /^[a-z]/
const SKIPPED = new Set(['loc', 'leadingComments', 'trailingComments', 'innerComments', 'extra'])

const program = (code: string) =>
  parseProgram(code, { sourceType: 'module', plugins: ['jsx', 'typescript'] }).program

/** Every AST node under `node`; `visit` answering false keeps the walk out of that one's insides. */
function walk(node: unknown, visit: (node: t.Node) => boolean) {
  if (!node || typeof node !== 'object') return
  if (Array.isArray(node)) {
    for (const each of node) walk(each, visit)
    return
  }
  if ('type' in node && typeof node.type === 'string' && !visit(node as t.Node)) return
  for (const [key, value] of Object.entries(node)) {
    if (!SKIPPED.has(key) && value && typeof value === 'object') walk(value, visit)
  }
}

const tagOf = (element: t.JSXElement) =>
  element.openingElement.name.type === 'JSXIdentifier' ? element.openingElement.name.name : null

/** A Widget's own components: its element children named like one. */
function widgetChildren(element: t.JSXElement): t.JSXElement[] {
  return element.children.filter(
    (child): child is t.JSXElement =>
      child.type === 'JSXElement' && COMPONENT.test(tagOf(child) ?? ''),
  )
}

function drawnNode(child: t.JSXElement, slice: (node: t.Node) => string): string {
  const props = child.openingElement.attributes.flatMap((attribute) => {
    if (attribute.type === 'JSXSpreadAttribute') return [`...(${slice(attribute.argument)})`]
    if (attribute.name.type !== 'JSXIdentifier') return []
    const key = JSON.stringify(attribute.name.name)
    const value = attribute.value
    if (!value) return [`${key}: true`]
    if (value.type === 'StringLiteral') return [`${key}: ${JSON.stringify(value.value)}`]
    if (value.type !== 'JSXExpressionContainer' || value.expression.type === 'JSXEmptyExpression')
      return []
    return [`${key}: (${slice(value.expression)})`]
  })
  return `{{ name: ${JSON.stringify(tagOf(child))}, props: { ${props.join(', ')} }, children: [] }}`
}

/**
 * Each `<Widget>`'s component as a drawn node, its props evaluated: the page never calls it —
 * the widget's frame does, with real React.
 */
export function widgetsAsNodes(module: string): string {
  if (!module.includes(`<${WIDGET}`)) return module
  const slice = (node: t.Node) => module.slice(node.start ?? 0, node.end ?? 0)
  const edits: { start: number; end: number; text: string }[] = []
  const visit = (node: t.Node): boolean => {
    if (node.type !== 'JSXElement' || tagOf(node) !== WIDGET) return true
    const drawn = new Set(widgetChildren(node))
    for (const child of drawn) {
      edits.push({ start: child.start ?? 0, end: child.end ?? 0, text: drawnNode(child, slice) })
    }
    walk(node.openingElement, visit)
    walk(
      node.children.filter((child) => !drawn.has(child as t.JSXElement)),
      visit,
    )
    return false
  }
  walk(program(module), visit)
  return edits
    .sort((a, b) => b.start - a.start)
    .reduce((text, edit) => text.slice(0, edit.start) + edit.text + text.slice(edit.end), module)
}

interface Unit {
  names: string[]
  node: t.Node
}

/** The page's top-level statements, each with the names it binds. */
function unitsOf(statements: t.Statement[]): { units: Unit[]; exported: string[] } {
  const units: Unit[] = []
  const exported: string[] = []
  for (const statement of statements) {
    const declared = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    const lent = statement.type === 'ExportNamedDeclaration'
    if (
      (declared?.type === 'FunctionDeclaration' || declared?.type === 'ClassDeclaration') &&
      declared.id
    ) {
      units.push({ names: [declared.id.name], node: declared })
      if (lent) exported.push(declared.id.name)
    } else if (declared?.type === 'VariableDeclaration') {
      for (const each of declared.declarations) {
        const names = each.id.type === 'Identifier' ? [each.id.name] : []
        units.push({ names, node: each })
        if (lent) exported.push(...names)
      }
    } else units.push({ names: [], node: statement })
  }
  return { units, exported }
}

function markupWidgets(node: WsxNode, out: string[]) {
  if (node.kind !== 'element') return
  if (node.name === WIDGET) {
    for (const child of node.children) if (child.kind === 'element') out.push(child.name)
  }
  for (const child of node.children) markupWidgets(child, out)
}

/** Names a widget reaches: its component, and every top-level name that one's code mentions. */
function widgetReach(units: Unit[], roots: string[]): Set<string> {
  const reached = new Set<string>()
  const queue = [...roots]
  while (queue.length > 0) {
    const name = queue.pop() ?? ''
    if (reached.has(name)) continue
    reached.add(name)
    for (const unit of units.filter((each) => each.names.includes(name))) {
      walk(unit.node, (node) => {
        if (node.type === 'Identifier' || node.type === 'JSXIdentifier') queue.push(node.name)
        return true
      })
    }
  }
  return reached
}

/**
 * DOM elements (`<div>`) are a widget's alone (D113): its component, what that one uses, or a
 * component the page exports for another's widget. Anywhere else in the code they are refused.
 */
export function domDiagnostics(root: WsxElement): Diagnostic[] {
  const source = root.prelude?.source
  if (!source || !/<[a-z]/.test(source)) return []
  const { units, exported } = unitsOf(program(source).body)
  const roots = [...exported]
  markupWidgets(root, roots)
  walk(units, (node) => {
    if (node.type === 'JSXElement' && tagOf(node) === WIDGET) {
      roots.push(...widgetChildren(node).map((child) => tagOf(child) ?? ''))
    }
    return true
  })
  const reach = widgetReach(units, roots)
  const out: Diagnostic[] = []
  for (const unit of units) {
    if (unit.names.some((name) => reach.has(name))) continue
    walk(unit.node, (node) => {
      const tag = node.type === 'JSXElement' ? tagOf(node) : null
      if (!tag || !INTRINSIC.test(tag)) return true
      out.push({
        severity: 'error',
        path: 'Sheet',
        line: node.loc?.start.line,
        column: node.loc?.start.column,
        message: `<${tag}> is the DOM — only a widget's component draws it, <Widget><Clock /></Widget>; the rest of a page draws registry primitives`,
      })
      return false
    })
  }
  return out
}
