import { ROW_ARG, SCOPE_ARG } from './constants'
import type { AggregateNode, ExprAst, ExprScopeShape, MemberNode, ValidateContext } from './types'

function list(items: string[]): string {
  return items.length === 0 ? 'none' : items.map((item) => `\`${item}\``).join(', ')
}

function identifier(name: string, ctx: ValidateContext): void {
  const isState = ctx.shape.state.includes(name)
  if (ctx.columns) {
    const isColumn = ctx.columns.includes(name)
    if (isColumn && isState) {
      ctx.problems.push(
        `warning: \`${name}\` in the where clause reads the ${ctx.sourceLabel} column and shadows the state key`,
      )
    }
    if (isColumn || isState) return
    ctx.problems.push(
      `unknown identifier \`${name}\` — ${ctx.sourceLabel} columns: ${list(ctx.columns)}; state keys: ${list(ctx.shape.state)}`,
    )
    return
  }
  if (isState) return
  ctx.problems.push(`unknown identifier \`${name}\` — state keys: ${list(ctx.shape.state)}`)
}

function arg(name: string, ctx: ValidateContext): void {
  if (name === SCOPE_ARG) {
    ctx.problems.push(
      '`$scope` is only valid as an aggregate source, like `count($scope)` or `sum($scope.points)`',
    )
    return
  }
  if (!ctx.shape.args.includes(name)) {
    ctx.problems.push(`unknown argument \`${name}\` — event args: ${list(ctx.shape.args)}`)
    return
  }
  if (name === ROW_ARG) {
    ctx.problems.push(
      `\`$row\` is a row, not a value — use \`$row.column\` (columns: ${list(ctx.shape.scopeColumns ?? [])})`,
    )
  }
}

function member(node: MemberNode, ctx: ValidateContext): void {
  if (node.arg !== ROW_ARG) {
    ctx.problems.push(`\`${node.arg}.${node.column}\` — column access is only allowed on \`$row\``)
    return
  }
  if (!ctx.shape.args.includes(ROW_ARG)) {
    ctx.problems.push(`\`$row\` is not available here — event args: ${list(ctx.shape.args)}`)
    return
  }
  const columns = ctx.shape.scopeColumns ?? []
  if (!columns.includes(node.column)) {
    ctx.problems.push(`unknown column \`$row.${node.column}\` — columns: ${list(columns)}`)
  }
}

function aggregateColumns(node: AggregateNode, ctx: ValidateContext): string[] | null {
  if (node.source.kind === 'scope') {
    if (ctx.shape.scopeColumns) return ctx.shape.scopeColumns
    ctx.problems.push('`$scope` has no rows in this context')
    return null
  }
  const columns = ctx.shape.tables[node.source.name]
  if (columns) return columns
  ctx.problems.push(
    `unknown table \`${node.source.name}\` — tables: ${list(Object.keys(ctx.shape.tables))}`,
  )
  return null
}

function aggregate(node: AggregateNode, ctx: ValidateContext): void {
  const label = node.source.kind === 'scope' ? '$scope' : node.source.name
  const columns = aggregateColumns(node, ctx)
  if (node.name === 'count' && node.column !== null) {
    ctx.problems.push(`\`count\` counts rows and takes no column — use \`count(${label})\``)
  }
  if (node.name !== 'count' && node.column === null) {
    ctx.problems.push(`\`${node.name}\` needs a column — like \`${node.name}(${label}.column)\``)
  }
  if (columns && node.column !== null && !columns.includes(node.column)) {
    ctx.problems.push(
      `unknown column \`${label}.${node.column}\` — ${label} columns: ${list(columns)}`,
    )
  }
  if (node.where) {
    walk(node.where, { ...ctx, columns: columns ?? [], sourceLabel: label })
  }
}

function walk(node: ExprAst, ctx: ValidateContext): void {
  switch (node.kind) {
    case 'literal':
      break
    case 'identifier':
      identifier(node.name, ctx)
      break
    case 'arg':
      arg(node.name, ctx)
      break
    case 'member':
      member(node, ctx)
      break
    case 'unary':
      walk(node.operand, ctx)
      break
    case 'binary':
      walk(node.left, ctx)
      walk(node.right, ctx)
      break
    case 'aggregate':
      aggregate(node, ctx)
      break
    case 'call':
      for (const argument of node.args) walk(argument, ctx)
      break
  }
}

/** Human-readable problems; empty means valid. Shadowing is reported with a `warning:` prefix. */
export function validateExpr(ast: ExprAst, scope: ExprScopeShape): string[] {
  const ctx: ValidateContext = { shape: scope, columns: null, sourceLabel: null, problems: [] }
  walk(ast, ctx)
  return ctx.problems
}
