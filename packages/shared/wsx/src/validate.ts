import type { z } from 'zod'
import type { ComponentSpec, Diagnostic, WsxElement, WsxNode, WsxRegistry } from './types'

const DEFAULT_BUDGET = { nodes: 400, binds: 8, exprs: 24 }
const HANDLERS = new Set(['onPress', 'onClick'])

interface Walk {
  registry: WsxRegistry
  out: Diagnostic[]
  seen: Map<string, number>
  nodes: number
  binds: number
  exprs: number
  components: Set<string>
}

function error(out: Diagnostic[], path: string, message: string) {
  out.push({ severity: 'error', message, path })
}

function legalValues(issue: z.core.$ZodIssue): string | null {
  if (issue.code === 'invalid_value' && 'values' in issue) {
    return issue.values.map(String).join(' · ')
  }
  return null
}

function valueAt(props: Record<string, unknown>, path: PropertyKey[]): unknown {
  let current: unknown = props
  for (const key of path) {
    if (current === null || typeof current !== 'object') return undefined
    current = (current as Record<string, unknown>)[String(key)]
  }
  return current
}

function propIssue(
  name: string,
  spec: ComponentSpec,
  registry: WsxRegistry,
  issue: z.core.$ZodIssue,
  props: Record<string, unknown>,
): string {
  const prop = issue.path.map(String).join('.')
  if (issue.code === 'unrecognized_keys') {
    return issue.keys
      .map((key) => {
        const hint = spec.hints?.[key] ?? registry.hints?.[key]
        return `prop ${key} is not addressable on <${name}>${hint ? ` — ${hint}` : ''}`
      })
      .join('; ')
  }
  const legal = legalValues(issue)
  const value = valueAt(props, issue.path)
  if (legal && value === undefined) return `prop ${prop} is required — one of ${legal}`
  if (legal) return `prop ${prop}: ${JSON.stringify(value)} is not one of ${legal}`
  return prop ? `prop ${prop}: ${issue.message}` : issue.message
}

function checkChildren(node: WsxElement, spec: ComponentSpec, path: string, walk: Walk) {
  const { out } = walk
  if (spec.children === 'component') {
    const [only, ...rest] = node.children
    const isComponent = only?.kind === 'element' && walk.components.has(only.name)
    if (!isComponent || rest.length > 0) {
      error(out, path, spec.childWords ?? `<${node.name}> takes one of the page's own components`)
    }
  }
  if (spec.children === 'none' && node.children.length > 0) {
    error(out, path, `<${node.name}> does not take children`)
  }
  if (spec.children === 'text' && node.children.some((child) => child.kind === 'element')) {
    error(out, path, `<${node.name}> takes text children only`)
  }
}

function checkPlacement(
  node: WsxElement,
  spec: ComponentSpec,
  ancestors: string[],
  path: string,
  walk: Walk,
) {
  if (spec.noNest && ancestors.includes(node.name)) {
    error(
      walk.out,
      path,
      `<${node.name}> cannot contain another <${node.name}> — a second view is a second sheet`,
    )
  }
  if (spec.within && !ancestors.some((name) => spec.within?.includes(name))) {
    error(walk.out, path, `<${node.name}> is only legal inside <${spec.within.join('> or <')}>`)
  }
  if (spec.unique) {
    const count = (walk.seen.get(node.name) ?? 0) + 1
    walk.seen.set(node.name, count)
    if (count === 2) error(walk.out, path, `<${node.name}> may appear once per sheet`)
  }
}

/**
 * A prop written as code is checked by name here and by value once the page has run; a handler
 * (`onPress`) is code by nature, and a code `key` only tells a `.map` its rows apart.
 */
function checkProps(node: WsxElement, spec: ComponentSpec, nodePath: string, walk: Walk) {
  const keys = Object.keys(node.code ?? {})
  // A handler becomes the element's `action` once the page runs.
  const handled = keys.some((key) => HANDLERS.has(key)) ? ['action'] : []
  const written = [...keys.filter((key) => !HANDLERS.has(key) && key !== 'key'), ...handled]
  const probe = { ...node.props, ...Object.fromEntries(written.map((key) => [key, null])) }
  const parsed = spec.props.safeParse(probe)
  if (parsed.success) return
  for (const issue of parsed.error.issues) {
    if (written.includes(String(issue.path[0]))) continue
    if (issue.code === 'unrecognized_keys' && handled.length > 0 && issue.keys.includes('action')) {
      error(walk.out, nodePath, `<${node.name}> takes no press — put onPress on a <Button>`)
      const rest = issue.keys.filter((key) => key !== 'action')
      if (rest.length === 0) continue
      error(
        walk.out,
        nodePath,
        propIssue(node.name, spec, walk.registry, { ...issue, keys: rest }, probe),
      )
      continue
    }
    error(walk.out, nodePath, propIssue(node.name, spec, walk.registry, issue, probe))
  }
}

function visit(node: WsxNode, ancestors: string[], path: string, walk: Walk) {
  if (node.kind !== 'element') return
  const nodePath = path ? `${path} > ${node.name}` : node.name
  walk.nodes += 1
  if ('bind' in node.props) walk.binds += 1
  if ('expr' in node.props) walk.exprs += 1

  const next = [...ancestors, node.name]
  const spec = walk.registry.components[node.name]
  if (!spec && walk.components.has(node.name)) {
    for (const child of node.children) visit(child, next, nodePath, walk)
    return
  }
  if (!spec) {
    error(
      walk.out,
      nodePath,
      `<${node.name}> is not a registry primitive — write <Missing kind="${node.name}" reason="…" /> and the registry hears about it`,
    )
    return
  }

  const owner = [...ancestors].reverse().find((name) => spec.within?.includes(name))
  const props = owner ? spec.propsWithin?.[owner] : undefined
  checkProps(node, props ? { ...spec, props } : spec, nodePath, walk)
  checkChildren(node, spec, nodePath, walk)
  checkPlacement(node, spec, ancestors, nodePath, walk)
  for (const child of node.children) visit(child, next, nodePath, walk)
}

function checkBudget(walk: Walk) {
  const budget = walk.registry.budget ?? DEFAULT_BUDGET
  const over = [
    walk.nodes > budget.nodes && `${walk.nodes} nodes (budget ${budget.nodes})`,
    walk.binds > budget.binds && `${walk.binds} binds (budget ${budget.binds})`,
    walk.exprs > budget.exprs && `${walk.exprs} expressions (budget ${budget.exprs})`,
  ].filter((item): item is string => typeof item === 'string')
  if (over.length > 0) {
    walk.out.push({
      severity: 'warning',
      path: 'Sheet',
      message: `over the complexity budget — ${over.join(', ')}. Split into linked sheets (<Ref>).`,
    })
  }
}

/** Schema-validate a parsed tree against a component registry. Errors name path, prop and alternatives. */
export function validate(root: WsxElement, registry: WsxRegistry): Diagnostic[] {
  const walk: Walk = {
    registry,
    out: [],
    seen: new Map(),
    nodes: 0,
    binds: 0,
    exprs: 0,
    components: new Set(root.prelude?.components),
  }
  if (root.name !== 'Sheet') {
    error(walk.out, root.name, 'the root element must be <Sheet>')
  }
  if (root.code) {
    error(walk.out, 'Sheet', "a <Sheet>'s own props are literal — its look and who reads it")
  }
  visit(root, [], '', walk)
  checkBudget(walk)
  return walk.out
}

export function hasErrors(diagnostics: Diagnostic[]): boolean {
  return diagnostics.some((diagnostic) => diagnostic.severity === 'error')
}
