import { parseExpression } from '@babel/parser'
import type * as t from '@babel/types'
import type { Diagnostic, WsxElement, WsxNode, WsxValue } from './types'

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

/** Literal-only expression → plain JSON value. Anything executable is rejected. */
function literalValue(node: t.Node): WsxValue {
  switch (node.type) {
    case 'StringLiteral':
      return node.value
    // A backtick string with nothing interpolated is a string — how a script or a code block keeps
    // its lines readable in source. One `${…}` would be an expression, so it is refused.
    case 'TemplateLiteral':
      if (node.expressions.length > 0) {
        return fail('a backtick string may not interpolate — write \\${ to keep one', node)
      }
      return node.quasis[0]?.value.cooked ?? ''
    case 'NumericLiteral':
      return node.value
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'UnaryExpression':
      if (node.operator === '-' && node.argument.type === 'NumericLiteral') {
        return -node.argument.value
      }
      return fail('only negative number literals are allowed', node)
    case 'ArrayExpression':
      return node.elements.map((element) => {
        if (!element || element.type === 'SpreadElement') {
          return fail('array holes and spreads are not allowed', node)
        }
        return literalValue(element)
      })
    case 'ObjectExpression': {
      const out: Record<string, WsxValue> = {}
      for (const property of node.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) {
          return fail('only plain `key: value` object properties are allowed', property)
        }
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'StringLiteral'
              ? property.key.value
              : fail('object keys must be identifiers or strings', property)
        out[key] = literalValue(property.value)
      }
      return out
    }
    default:
      return fail(`\`${node.type}\` is not allowed in WSX — props are JSON literals only`, node)
  }
}

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

function convertElement(node: t.JSXElement): WsxElement {
  const name = elementName(node)
  const props: Record<string, WsxValue> = {}

  for (const attribute of node.openingElement.attributes) {
    if (attribute.type === 'JSXSpreadAttribute') {
      return fail('prop spreads are not allowed', attribute)
    }
    if (attribute.name.type !== 'JSXIdentifier') {
      return fail('namespaced props are not allowed', attribute)
    }
    const key = attribute.name.name
    if (attribute.value == null) {
      props[key] = true
    } else if (attribute.value.type === 'StringLiteral') {
      props[key] = attribute.value.value
    } else if (attribute.value.type === 'JSXExpressionContainer') {
      props[key] = literalValue(attribute.value.expression)
    } else {
      return fail('element-valued props are not allowed', attribute)
    }
  }

  return { kind: 'element', name, props, children: convertChildren(node.children) }
}

function convertChildren(children: t.JSXElement['children']): WsxNode[] {
  const out: WsxNode[] = []
  for (const child of children) {
    switch (child.type) {
      case 'JSXText': {
        const value = child.value.replace(/\s+/g, ' ')
        if (value.trim().length > 0) out.push({ kind: 'text', value: value.trim() })
        break
      }
      case 'JSXElement':
        out.push(convertElement(child))
        break
      case 'JSXExpressionContainer': {
        if (child.expression.type === 'JSXEmptyExpression') break
        const value = literalValue(child.expression)
        if (typeof value === 'object') {
          fail('object and array literals are not allowed as children', child)
        }
        out.push({ kind: 'text', value: String(value) })
        break
      }
      case 'JSXFragment':
        fail('fragments are not allowed — a sheet has one root element', child)
        break
      case 'JSXSpreadChild':
        fail('spread children are not allowed', child)
        break
    }
  }
  return out
}

/** Parse WSX source into a node tree. Throws WsxParseError with diagnostics. */
export function parse(source: string): WsxElement {
  const trimmed = source.trim()
  if (trimmed.length === 0) throw new WsxParseError([{ severity: 'error', message: 'empty sheet' }])

  let expression: t.Expression
  try {
    expression = parseExpression(trimmed, { plugins: ['jsx'] })
  } catch (error) {
    const parseError = error as { message?: string; loc?: { line: number; column: number } }
    throw new WsxParseError([
      {
        severity: 'error',
        message: parseError.message ?? 'invalid WSX syntax',
        line: parseError.loc?.line,
        column: parseError.loc?.column,
      },
    ])
  }

  if (expression.type !== 'JSXElement') {
    throw new WsxParseError([
      { severity: 'error', message: 'a sheet must be a single JSX element' },
    ])
  }
  return convertElement(expression)
}
