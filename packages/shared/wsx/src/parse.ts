import { parseExpression } from '@babel/parser'
import type * as t from '@babel/types'
import { literalValue, NotLiteral } from './literal'
import { fail, splitPage, syntaxError } from './split'
import type { Slice, WsxElement, WsxNode, WsxValue } from './types'

function elementName(node: t.JSXElement): string {
  const opening = node.openingElement.name
  if (opening.type !== 'JSXIdentifier') {
    return fail('member and namespaced element names are not allowed', node)
  }
  if (!/^[A-Z]/.test(opening.name)) {
    return fail(
      `host element <${opening.name}> is not allowed — WSX uses registry components only`,
      node,
    )
  }
  return opening.name
}

/** A literal stays data; anything else is code the page runs, kept as its source. */
function valueOf(node: t.Expression, slice: Slice): { value: WsxValue } | { code: string } {
  try {
    return { value: literalValue(node) }
  } catch (error) {
    if (error instanceof NotLiteral) return { code: slice(node) }
    throw error
  }
}

function convertElement(node: t.JSXElement, slice: Slice): WsxElement {
  const name = elementName(node)
  const props: Record<string, WsxValue> = {}
  const code: Record<string, string> = {}

  for (const attribute of node.openingElement.attributes) {
    if (attribute.type === 'JSXSpreadAttribute') {
      return fail('prop spreads are not allowed — name each prop', attribute)
    }
    if (attribute.name.type !== 'JSXIdentifier') {
      return fail('namespaced props are not allowed', attribute)
    }
    const key = attribute.name.name
    const value = attribute.value
    if (value == null) props[key] = true
    else if (value.type === 'StringLiteral') props[key] = value.value
    else if (value.type === 'JSXExpressionContainer') {
      if (value.expression.type === 'JSXEmptyExpression') {
        return fail(`prop ${key} is empty — give it a value`, attribute)
      }
      const read = valueOf(value.expression, slice)
      if ('value' in read) props[key] = read.value
      else code[key] = read.code
    } else return fail('element-valued props are not allowed', attribute)
  }

  const element: WsxElement = {
    kind: 'element',
    name,
    props,
    children: convertChildren(node.children, slice),
  }
  if (Object.keys(code).length > 0) element.code = code
  return element
}

type Child = t.JSXElement['children'][number]

/** Whether a child is code the page runs — a `{…}` that is not a literal, a fragment, a spread. */
function isHole(child: Child | undefined, slice: Slice): boolean {
  if (child?.type === 'JSXFragment' || child?.type === 'JSXSpreadChild') return true
  if (child?.type !== 'JSXExpressionContainer' || child.expression.type === 'JSXEmptyExpression') {
    return false
  }
  const read = valueOf(child.expression, slice)
  return 'code' in read || (read.value !== null && typeof read.value === 'object')
}

/**
 * Text as JSX reads it — whitespace holding a line break goes — then runs of spaces as one. Its
 * edges are trimmed too, except where they touch code: `Hello {name}` keeps its space.
 */
function textOf(raw: string, keepStart: boolean, keepEnd: boolean): string | null {
  const lines = raw.split(/\r\n|\n|\r/)
  const kept = lines
    .map((line, at) => {
      const start = at > 0 ? line.trimStart() : line
      return at < lines.length - 1 ? start.trimEnd() : start
    })
    .filter((line, at) => line.length > 0 || (lines.length === 1 && at === 0))
  let value = kept.join(' ').replace(/\s+/g, ' ')
  if (!keepStart) value = value.trimStart()
  if (!keepEnd) value = value.trimEnd()
  return value.length > 0 ? value : null
}

function convertChildren(children: t.JSXElement['children'], slice: Slice): WsxNode[] {
  const out: WsxNode[] = []
  children.forEach((child, at) => {
    switch (child.type) {
      case 'JSXText': {
        const keepStart = isHole(children[at - 1], slice)
        const keepEnd = isHole(children[at + 1], slice)
        const value = textOf(child.value, keepStart, keepEnd)
        if (value !== null && (value.trim().length > 0 || (keepStart && keepEnd))) {
          out.push({ kind: 'text', value })
        }
        break
      }
      case 'JSXElement':
        out.push(convertElement(child, slice))
        break
      case 'JSXExpressionContainer': {
        if (child.expression.type === 'JSXEmptyExpression') break
        const read = valueOf(child.expression, slice)
        if ('code' in read || (read.value !== null && typeof read.value === 'object')) {
          out.push({ kind: 'code', source: slice(child.expression) })
        } else out.push({ kind: 'text', value: String(read.value) })
        break
      }
      case 'JSXFragment':
      case 'JSXSpreadChild':
        out.push({ kind: 'code', source: slice(child) })
        break
    }
  })
  return out
}

const COMPONENT = /^[A-Z]/

/** Capitalized names the code binds at its top level: the page's own components. */
function componentsOf(statements: t.Statement[]): string[] {
  const names = new Set<string>()
  const bind = (id: t.Node | null | undefined) => {
    if (id?.type === 'Identifier' && COMPONENT.test(id.name)) names.add(id.name)
  }
  for (const statement of statements) {
    const declared = statement.type === 'ExportNamedDeclaration' ? statement.declaration : statement
    if (!declared) continue
    if (declared.type === 'ImportDeclaration') {
      for (const specifier of declared.specifiers) bind(specifier.local)
    }
    if (declared.type === 'FunctionDeclaration' || declared.type === 'ClassDeclaration') {
      bind(declared.id)
    }
    if (declared.type === 'VariableDeclaration') {
      for (const each of declared.declarations) bind(each.id)
    }
  }
  return [...names]
}

function markupOf(text: string, lineOffset: number): WsxElement {
  let expression: t.Expression
  try {
    expression = parseExpression(text, { plugins: ['jsx', 'typescript'] })
  } catch (error) {
    throw syntaxError(error, lineOffset)
  }
  if (expression.type !== 'JSXElement') {
    return fail('a sheet must be a single JSX element')
  }
  return convertElement(expression, (node) => text.slice(node.start ?? 0, node.end ?? 0))
}

/** Parse WSX source into a node tree, a page's code (if any) kept as source. Throws WsxParseError. */
export function parse(source: string): WsxElement {
  const page = splitPage(source)
  const root = markupOf(page.markup, page.lineOffset)
  if (page.code) {
    root.prelude = { source: page.code.text, components: componentsOf(page.code.statements) }
  }
  return root
}
