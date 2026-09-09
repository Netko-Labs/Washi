import { EXPR_LIMITS, MS_PER_DAY, ROW_ARG } from './constants'
import { ExprBudgetError, ExprEvalError } from './errors'
import type {
  AggregateNode,
  BinaryNode,
  BinaryOperator,
  EvalContext,
  ExprAst,
  ExprEvaluateOptions,
  ExprScope,
  ExprValue,
  Row,
  Scalar,
} from './types'

const FORMAT_HINT = 'expr may compute a value, never format it — use Money/Text'

function typeName(value: Scalar): string {
  return value === null ? 'null' : typeof value
}

function spend(ctx: EvalContext, depth: number): void {
  ctx.steps += 1
  if (ctx.steps > ctx.limits.budget) throw new ExprBudgetError('budget', ctx.limits.budget)
  if (depth > ctx.limits.depth) throw new ExprBudgetError('depth', ctx.limits.depth)
}

function isRow(value: Scalar | Row | undefined): value is Row {
  return typeof value === 'object' && value !== null
}

function add(left: Scalar, right: Scalar): Scalar {
  if (typeof left === 'number' && typeof right === 'number') return left + right
  if (typeof left === 'string' && typeof right === 'string') return left + right
  if (left === null || right === null) return null
  if (typeof left === 'string' || typeof right === 'string') {
    throw new ExprEvalError(
      `\`+\` cannot join ${typeName(left)} and ${typeName(right)}: ${FORMAT_HINT}`,
    )
  }
  throw new ExprEvalError(`\`+\` expects numbers or strings, got ${typeName(left)}`)
}

function arithmetic(operator: BinaryOperator, left: Scalar, right: Scalar): Scalar {
  if (left === null || right === null) return null
  if (typeof left !== 'number' || typeof right !== 'number') {
    throw new ExprEvalError(
      `\`${operator}\` expects numbers, got ${typeName(left)} and ${typeName(right)}`,
    )
  }
  switch (operator) {
    case '-':
      return left - right
    case '*':
      return left * right
    default:
      return right === 0 ? null : left / right
  }
}

function compare(operator: BinaryOperator, left: Scalar, right: Scalar): boolean {
  if (operator === '=') return left === right
  if (operator === '!=') return left !== right
  const comparable =
    (typeof left === 'number' && typeof right === 'number') ||
    (typeof left === 'string' && typeof right === 'string')
  if (!comparable) return false
  switch (operator) {
    case '<':
      return left < right
    case '<=':
      return left <= right
    case '>':
      return left > right
    default:
      return left >= right
  }
}

function truthy(operator: string, value: Scalar): boolean {
  if (value === null) return false
  if (typeof value !== 'boolean') {
    throw new ExprEvalError(`\`${operator}\` expects a boolean, got ${typeName(value)}`)
  }
  return value
}

function binary(node: BinaryNode, ctx: EvalContext, depth: number): Scalar {
  const left = visit(node.left, ctx, depth)
  if (node.operator === 'and') {
    return truthy('and', left) ? truthy('and', visit(node.right, ctx, depth)) : false
  }
  if (node.operator === 'or') {
    return truthy('or', left) ? true : truthy('or', visit(node.right, ctx, depth))
  }
  const right = visit(node.right, ctx, depth)
  switch (node.operator) {
    case '+':
      return add(left, right)
    case '-':
    case '*':
    case '/':
      return arithmetic(node.operator, left, right)
    default:
      return compare(node.operator, left, right)
  }
}

function identifier(name: string, ctx: EvalContext): Scalar {
  if (ctx.row && name in ctx.row) return ctx.row[name] as Scalar
  if (name in ctx.scope.state) return ctx.scope.state[name] as Scalar
  throw new ExprEvalError(`unknown identifier \`${name}\``)
}

function arg(name: string, ctx: EvalContext): Scalar {
  const value = ctx.scope.args[name]
  if (value === undefined) throw new ExprEvalError(`unknown argument \`${name}\``)
  if (isRow(value))
    throw new ExprEvalError(`\`${name}\` is a row, not a value — use \`${name}.column\``)
  return value
}

function member(argName: string, column: string, ctx: EvalContext): Scalar {
  const value = ctx.scope.args[argName]
  if (argName !== ROW_ARG || !isRow(value)) {
    throw new ExprEvalError(`\`${argName}\` has no columns — only \`$row.column\` is allowed`)
  }
  return value[column] ?? null
}

function sourceRows(node: AggregateNode, ctx: EvalContext): Row[] {
  if (node.source.kind === 'scope') {
    if (!ctx.scope.scopeRows) throw new ExprEvalError('`$scope` has no rows in this context')
    return ctx.scope.scopeRows
  }
  const table = node.source.name
  let rows: Row[] | undefined
  try {
    rows = ctx.scope.rows(table)
  } catch {
    rows = undefined
  }
  if (!Array.isArray(rows)) throw new ExprEvalError(`unknown table \`${table}\``)
  return rows
}

function aggregate(node: AggregateNode, ctx: EvalContext, depth: number): Scalar {
  const outer = ctx.row
  let count = 0
  let numbers = 0
  let sum = 0
  let min: number | null = null
  let max: number | null = null
  for (const row of sourceRows(node, ctx)) {
    spend(ctx, depth)
    ctx.row = row
    const keep = node.where ? visit(node.where, ctx, depth + 1) : true
    ctx.row = outer
    if (keep !== true) continue
    count += 1
    const value = node.column === null ? null : (row[node.column] ?? null)
    if (typeof value !== 'number') continue
    numbers += 1
    sum += value
    min = min === null ? value : Math.min(min, value)
    max = max === null ? value : Math.max(max, value)
  }
  switch (node.name) {
    case 'count':
      return count
    case 'sum':
      return sum
    case 'avg':
      return numbers === 0 ? null : sum / numbers
    case 'min':
      return min
    case 'max':
      return max
  }
}

function toMs(value: Scalar): number | null {
  if (value === null) return null
  if (typeof value === 'number') return value
  const parsed = typeof value === 'string' ? Date.parse(value) : Number.NaN
  if (Number.isNaN(parsed)) {
    throw new ExprEvalError(`days() expects ISO date strings or ms numbers, got ${typeName(value)}`)
  }
  return parsed
}

function call(node: Extract<ExprAst, { kind: 'call' }>, ctx: EvalContext, depth: number): Scalar {
  if (node.name === 'now') return ctx.scope.now
  const from = toMs(visit(node.args[0] as ExprAst, ctx, depth))
  const to = toMs(visit(node.args[1] as ExprAst, ctx, depth))
  if (from === null || to === null) return null
  return Math.trunc((to - from) / MS_PER_DAY)
}

function visit(node: ExprAst, ctx: EvalContext, depth: number): Scalar {
  spend(ctx, depth)
  const inner = depth + 1
  switch (node.kind) {
    case 'literal':
      return node.value
    case 'identifier':
      return identifier(node.name, ctx)
    case 'arg':
      return arg(node.name, ctx)
    case 'member':
      return member(node.arg, node.column, ctx)
    case 'unary': {
      const value = visit(node.operand, ctx, inner)
      if (node.operator === 'not') return !truthy('not', value)
      if (value === null) return null
      if (typeof value !== 'number') {
        throw new ExprEvalError(`unary \`-\` expects a number, got ${typeName(value)}`)
      }
      return -value
    }
    case 'binary':
      return binary(node, ctx, inner)
    case 'aggregate':
      return aggregate(node, ctx, inner)
    case 'call':
      return call(node, ctx, inner)
  }
}

export function evaluateExpr(
  ast: ExprAst,
  scope: ExprScope,
  options: ExprEvaluateOptions = {},
): ExprValue {
  const ctx: EvalContext = { scope, limits: { ...EXPR_LIMITS, ...options }, steps: 0, row: null }
  return visit(ast, ctx, 1)
}
