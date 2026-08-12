import type { Diagnostic, WsxElement, WsxNode, WsxRegistry } from './types'

function validateNode(node: WsxNode, registry: WsxRegistry, path: string, out: Diagnostic[]) {
  if (node.kind === 'text') return

  const spec = registry[node.name]
  const nodePath = path ? `${path} > ${node.name}` : node.name

  if (!spec) {
    out.push({
      severity: 'error',
      message: `<${node.name}> is not a registry component`,
      path: nodePath,
    })
    return
  }

  const parsed = spec.props.safeParse(node.props)
  if (!parsed.success) {
    for (const issue of parsed.error.issues) {
      out.push({
        severity: 'error',
        message: `prop ${issue.path.join('.') || '(root)'}: ${issue.message}`,
        path: nodePath,
      })
    }
  }

  if (spec.children === 'none' && node.children.length > 0) {
    out.push({
      severity: 'error',
      message: `<${node.name}> does not take children`,
      path: nodePath,
    })
  }
  if (spec.children === 'text') {
    for (const child of node.children) {
      if (child.kind !== 'text') {
        out.push({
          severity: 'error',
          message: `<${node.name}> takes text children only`,
          path: nodePath,
        })
        break
      }
    }
  }

  for (const child of node.children) validateNode(child, registry, nodePath, out)
}

/** Schema-validate a parsed tree against a component registry. */
export function validate(root: WsxElement, registry: WsxRegistry): Diagnostic[] {
  const out: Diagnostic[] = []
  if (root.name !== 'Sheet') {
    out.push({ severity: 'error', message: 'the root element must be <Sheet>', path: root.name })
  }
  validateNode(root, registry, '', out)
  return out
}
