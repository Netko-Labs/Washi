import { type ExprAst, parseExpr, type WsxElement, type WsxNode, type WsxValue } from '@washi/wsx'

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

export function walk(root: WsxElement, visit: (node: WsxElement) => void) {
  const descend = (node: WsxNode) => {
    if (node.kind !== 'element') return
    visit(node)
    for (const child of node.children) descend(child)
  }
  descend(root)
}

export const tableOf = (value: unknown): string | null => {
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

const isSecretTab = (node: WsxNode) =>
  node.kind === 'element' && node.name === 'Tab' && node.props.secret === true

/** How much a page hides when shared — a write may not lower it on a public page. */
export function redactionWeight(root: WsxElement): number {
  let weight = 0
  walk(root, (node) => {
    if (node.name === 'Redact' || isSecretTab(node)) weight += 1
    if (Array.isArray(node.props.redact)) weight += node.props.redact.length
  })
  return weight
}

/** A Tabs without its secret tabs and their labels; null when every tab was secret (D127). */
function withoutSecretTabs(node: WsxElement): WsxElement | null {
  if (!node.children.some(isSecretTab)) return node
  const labels = Array.isArray(node.props.labels) ? node.props.labels : []
  const kept = node.children.flatMap((child, at) =>
    isSecretTab(child) ? [] : [{ child, label: labels[at] }],
  )
  if (kept.length === 0) return null
  return {
    ...node,
    props: { ...node.props, labels: kept.map((each) => each.label ?? '') },
    children: kept.map((each) => each.child),
  }
}

function redactNode(node: WsxElement): WsxElement | null {
  if (node.name === 'Redact') return { ...node, children: [] }
  const shown = node.name === 'Tabs' ? withoutSecretTabs(node) : node
  if (!shown) return null
  return {
    ...shown,
    children: shown.children.flatMap((child): WsxNode[] => {
      if (child.kind !== 'element') return [child]
      const kept = redactNode(child)
      return kept ? [kept] : []
    }),
  }
}

/**
 * The page's state with no secret tab's label as a starting value: a link never reads one. Only the
 * key a Tabs with a secret tab follows is touched, and only for labels none of its shown tabs wear.
 */
function withoutSecretState(root: WsxElement): WsxElement {
  const secret = new Map<string, Set<WsxValue>>()
  walk(root, (node) => {
    const key = node.props.state
    if (node.name !== 'Tabs' || typeof key !== 'string' || !Array.isArray(node.props.labels)) return
    const labels = node.props.labels as WsxValue[]
    const isHidden = (at: number) => {
      const child = node.children[at]
      return child !== undefined && isSecretTab(child)
    }
    const shown = new Set(labels.filter((_, at) => !isHidden(at)))
    const hidden = labels.filter((label, at) => isHidden(at) && !shown.has(label))
    if (hidden.length > 0) secret.set(key, new Set([...(secret.get(key) ?? []), ...hidden]))
  })
  const state = root.props.state
  if (secret.size === 0 || !state || typeof state !== 'object' || Array.isArray(state)) return root
  const scrubbed: Record<string, WsxValue> = {}
  for (const [scope, values] of Object.entries(state)) {
    scrubbed[scope] =
      values && typeof values === 'object' && !Array.isArray(values)
        ? Object.fromEntries(
            Object.entries(values).filter(([key, value]) => !secret.get(key)?.has(value)),
          )
        : values
  }
  return { ...root, props: { ...root.props, state: scrubbed } }
}

/**
 * The page as a link shows it: each `<Redact>` keeps its reason and loses its contents, and each
 * secret `<Tab>` is gone with its label (D127) — a visitor never learns it was there.
 */
export function redactForShare(node: WsxElement): WsxElement {
  return redactNode(withoutSecretState(node)) ?? { ...node, children: [] }
}

/** What a link leaves out, in counts the Share popover can say in words. */
export function redactionSummary(root: WsxElement): {
  blocks: number
  tabs: number
  columns: Record<string, string[]>
} {
  let blocks = 0
  let tabs = 0
  walk(root, (node) => {
    if (node.name === 'Redact') blocks += 1
    if (isSecretTab(node)) tabs += 1
  })
  const columns: Record<string, string[]> = {}
  for (const [table, set] of redactedColumns(root)) columns[table] = [...set].sort()
  return { blocks, tabs, columns }
}
