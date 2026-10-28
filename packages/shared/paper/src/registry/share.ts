import { type ExprAst, parseExpr, type WsxElement, type WsxNode } from '@washi/wsx'

function aggregateTables(ast: ExprAst, out: Set<string>) {
  switch (ast.kind) {
    case 'aggregate':
      if (ast.source.kind === 'table') out.add(ast.source.name)
      if (ast.where) aggregateTables(ast.where, out)
      return
    case 'binary':
      aggregateTables(ast.left, out)
      aggregateTables(ast.right, out)
      return
    case 'unary':
      aggregateTables(ast.operand, out)
      return
    case 'call':
    case 'fn':
      for (const arg of ast.args) aggregateTables(arg, out)
      return
    default:
      return
  }
}

function walk(root: WsxElement, visit: (node: WsxElement) => void) {
  const descend = (node: WsxNode) => {
    if (node.kind !== 'element') return
    visit(node)
    for (const child of node.children) descend(child)
  }
  descend(root)
}

const tableOf = (value: unknown): string | null => {
  if (typeof value === 'string') return value
  if (value && typeof value === 'object' && 'table' in value) {
    const table = (value as { table: unknown }).table
    return typeof table === 'string' ? table : null
  }
  return null
}

/** Tables expressions aggregate over — prefetched once so `sum(tasks.points)` is synchronous. */
export function exprTables(root: WsxElement): string[] {
  const out = new Set<string>()
  walk(root, (node) => {
    if (typeof node.props.expr !== 'string') return
    try {
      aggregateTables(parseExpr(node.props.expr), out)
    } catch {
      // validation already reported it; the renderer shows null
    }
  })
  return [...out].sort()
}

/** Every table the page reads — the only ones a shared link may ask about (D65). */
export function pageTables(root: WsxElement): Set<string> {
  const out = new Set(exprTables(root))
  walk(root, (node) => {
    for (const key of ['bind', 'history', 'table'] as const) {
      const table = tableOf(node.props[key])
      if (table) out.add(table)
    }
  })
  return out
}

/** Columns any view on the page hides when shared, per table: one view's redact hides it from all. */
export function redactedColumns(root: WsxElement): Map<string, Set<string>> {
  const out = new Map<string, Set<string>>()
  walk(root, (node) => {
    const columns = node.props.redact
    if (!Array.isArray(columns)) return
    const table =
      tableOf(node.props.bind) ?? tableOf(node.props.history) ?? tableOf(node.props.table)
    if (!table) return
    const set = out.get(table) ?? new Set<string>()
    for (const column of columns) if (typeof column === 'string') set.add(column)
    out.set(table, set)
  })
  return out
}

/** How much a page hides when shared — a write may not lower it on a public page. */
export function redactionWeight(root: WsxElement): number {
  let weight = 0
  walk(root, (node) => {
    if (node.name === 'Redact') weight += 1
    if (Array.isArray(node.props.redact)) weight += node.props.redact.length
  })
  return weight
}

/** The page as a link shows it: each `<Redact>` keeps its reason and loses its contents. */
export function redactForShare(node: WsxElement): WsxElement {
  if (node.name === 'Redact') return { ...node, children: [] }
  return {
    ...node,
    children: node.children.map((child) =>
      child.kind === 'element' ? redactForShare(child) : child,
    ),
  }
}

/** What a link leaves out, in counts the Share popover can say in words. */
export function redactionSummary(root: WsxElement): {
  blocks: number
  columns: Record<string, string[]>
} {
  let blocks = 0
  walk(root, (node) => {
    if (node.name === 'Redact') blocks += 1
  })
  const columns: Record<string, string[]> = {}
  for (const [table, set] of redactedColumns(root)) columns[table] = [...set].sort()
  return { blocks, columns }
}
