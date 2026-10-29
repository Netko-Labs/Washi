import { parseExpression, parse as parseProgram } from '@babel/parser'
import type * as t from '@babel/types'
import { literalValue, NotLiteral } from './literal'
import type { Diagnostic, WsxElement, WsxNode, WsxPrelude, WsxValue } from './types'

export class WsxParseError extends Error {
  readonly diagnostics: Diagnostic[]

  constructor(diagnostics: Diagnostic[]) {
    super(diagnostics.map((diagnostic) => diagnostic.message).join('; '))
    this.name = 'WsxParseError'
    this.diagnostics = diagnostics
  }
}

function fail(message: string, node?: { loc?: t.SourceLocation | null }): never {
  throw new WsxParseError([
    {
      severity: 'error',
      message,
      line: node?.loc?.start.line,
      column: node?.loc?.start.column,
    },
  ])
}

type Slice = (node: t.Node) => string

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
      if (value.expression.type === 'JSXEmptyExpression') continue
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

function convertChildren(children: t.JSXElement['children'], slice: Slice): WsxNode[] {
  const out: WsxNode[] = []
  for (const child of children) {
    switch (child.type) {
      case 'JSXText': {
        const value = child.value.replace(/\s+/g, ' ')
        if (value.trim().length > 0) out.push({ kind: 'text', value: value.trim() })
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
  }
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

function preludeOf(text: string): WsxPrelude {
  const statements = parseProgram(text, {
    sourceType: 'module',
    plugins: ['jsx', 'typescript'],
  }).program.body
  for (const statement of statements) {
    if (statement.type === 'ExportDefaultDeclaration') {
      fail('a page is its own default export — export named functions only', statement)
    }
  }
  return { source: text.trim(), components: componentsOf(statements) }
}

function syntaxError(error: unknown, lineOffset: number): WsxParseError {
  if (error instanceof WsxParseError) return error
  const parseError = error as { message?: string; loc?: { line: number; column: number } }
  return new WsxParseError([
    {
      severity: 'error',
      message: parseError.message ?? 'invalid WSX syntax',
      line: parseError.loc ? parseError.loc.line + lineOffset : undefined,
      column: parseError.loc?.column,
    },
  ])
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

/** Where the markup may start: the text's head, then every line that opens a `<Sheet`. */
const SHEET_LINE = /^<Sheet\b/gm

/**
 * Parse WSX source into a node tree. A page that runs opens with code; its markup is the first
 * `<Sheet` at a line's start with code above that parses. Throws WsxParseError.
 */
export function parse(source: string): WsxElement {
  const text = source.trim()
  if (text.length === 0) throw new WsxParseError([{ severity: 'error', message: 'empty sheet' }])
  const starts = [...text.matchAll(SHEET_LINE)].map((match) => match.index).filter((at) => at > 0)
  if (starts.length === 0 || text.startsWith('<')) return markupOf(text, 0)

  let failure: unknown = null
  for (const start of starts) {
    const lineOffset = text.slice(0, start).split('\n').length - 1
    let prelude: WsxPrelude
    try {
      prelude = preludeOf(text.slice(0, start))
    } catch (error) {
      failure = syntaxError(error, 0)
      continue
    }
    const root = markupOf(text.slice(start), lineOffset)
    root.prelude = prelude
    return root
  }
  throw failure
}
