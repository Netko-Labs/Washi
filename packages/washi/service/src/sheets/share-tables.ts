import { pageTables } from '@washi/paper/registry'
import { listTables, type Workspace } from '@washi/repository'
import type { WsxElement, WsxNode } from '@washi/wsx'

/**
 * Where code names a table: a query's `table: 'tasks'`, or the first argument of a hook that takes
 * one (`useRow('tasks', id)`, `useTable('tasks')`, `useInsert('tasks')`…). A word that only happens
 * to match a table's name elsewhere — a label, a heading — names nothing.
 */
const NAMED = [
  /\btable\s*:\s*(['"`])([A-Za-z_][A-Za-z0-9_]{0,63})\1/g,
  /\buse(?:Row|Table|Insert|Update|Delete)\s*\(\s*(['"`])([A-Za-z_][A-Za-z0-9_]{0,63})\1/g,
]

/** Every piece of code a page holds: what runs above its markup, its code props and holes. */
function codeOf(node: WsxNode, into: string[] = []): string[] {
  if (node.kind === 'code') into.push(node.source)
  if (node.kind !== 'element') return into
  if (node.prelude) into.push(node.prelude.source)
  into.push(...Object.values(node.code ?? {}))
  for (const child of node.children) codeOf(child, into)
  return into
}

/**
 * The tables a page's code may read through its link (D125): those its author names in it as a
 * table. A name the code builds at run time is not one, and asks for it are refused like any other table
 * the page does not read — the link never widens past what the page itself says.
 */
export function codeTables(ws: Workspace, root: WsxElement): Set<string> {
  const code = codeOf(root).join('\n')
  if (!code) return new Set()
  const named = new Set(
    NAMED.flatMap((pattern) => [...code.matchAll(pattern)].map((match) => match[2] ?? '')),
  )
  return new Set(
    listTables(ws)
      .map((table) => table.name)
      .filter((name) => named.has(name)),
  )
}

/** Every table a link's page may ask about: its markup's (D65) and its code's (D125). */
export function linkTables(ws: Workspace, root: WsxElement): Set<string> {
  return new Set([...pageTables(root), ...codeTables(ws, root)])
}
