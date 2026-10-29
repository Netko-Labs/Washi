import type * as t from '@babel/types'
import type { WsxValue } from './types'

/** Thrown when an expression is code, not a literal — the parser keeps it as a hole instead. */
export class NotLiteral extends Error {}

const refuse = (): never => {
  throw new NotLiteral()
}

/** A JSON-shaped literal → its value; anything that would have to run throws `NotLiteral`. */
export function literalValue(node: t.Node): WsxValue {
  switch (node.type) {
    case 'StringLiteral':
      return node.value
    case 'TemplateLiteral':
      return node.expressions.length > 0 ? refuse() : (node.quasis[0]?.value.cooked ?? '')
    case 'NumericLiteral':
      return node.value
    case 'BooleanLiteral':
      return node.value
    case 'NullLiteral':
      return null
    case 'UnaryExpression':
      return node.operator === '-' && node.argument.type === 'NumericLiteral'
        ? -node.argument.value
        : refuse()
    case 'ArrayExpression':
      return node.elements.map((element) =>
        !element || element.type === 'SpreadElement' ? refuse() : literalValue(element),
      )
    case 'ObjectExpression': {
      const out: Record<string, WsxValue> = {}
      for (const property of node.properties) {
        if (property.type !== 'ObjectProperty' || property.computed) return refuse()
        const key =
          property.key.type === 'Identifier'
            ? property.key.name
            : property.key.type === 'StringLiteral'
              ? property.key.value
              : refuse()
        out[key] = literalValue(property.value)
      }
      return out
    }
    default:
      return refuse()
  }
}
