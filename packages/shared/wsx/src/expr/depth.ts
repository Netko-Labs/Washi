import type { ExprAst } from './types'

export function depthOf(ast: ExprAst): number {
  switch (ast.kind) {
    case 'literal':
    case 'identifier':
    case 'arg':
    case 'member':
      return 1
    case 'unary':
      return 1 + depthOf(ast.operand)
    case 'binary':
      return 1 + Math.max(depthOf(ast.left), depthOf(ast.right))
    case 'aggregate':
      return 1 + (ast.where ? depthOf(ast.where) : 0)
    case 'call':
    case 'fn':
      return 1 + ast.args.reduce((max, arg) => Math.max(max, depthOf(arg)), 0)
  }
}
