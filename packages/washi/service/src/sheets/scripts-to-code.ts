import {
  everySheetSource,
  getAppMeta,
  rewriteSourceQuietly,
  setAppMeta,
  type Workspace,
} from '@washi/repository'
import { parse, serialize, type WsxElement, type WsxNode } from '@washi/wsx'
import { lookOf } from './look-of'
import { checkSource } from './service'

const MIGRATED = 'scripts_as_code'

/** What a `<Script>` stood on, lent to the page: its keyed state is the page's state, as it was. */
const IMPORTS = "import { usePageState as useState, useRows, useInterval, act } from 'washi'"
const NOW = 'function now() {\n  return Date.now()\n}'

const textOf = (node: WsxElement) =>
  node.children.map((child) => (child.kind === 'text' ? child.value : '')).join('')

const indent = (code: string) =>
  code
    .split('\n')
    .map((line) => (line ? `  ${line}` : line))
    .join('\n')

/**
 * A page's `<Script>`s as its own components (D100): each becomes `ScriptN`, its code inside and
 * `view()` returned, drawn where the Script stood — titled, in a Section of that title.
 */
export function scriptsAsCode(root: WsxElement): string | null {
  const components: string[] = []
  const swap = (node: WsxNode): WsxNode => {
    if (node.kind !== 'element') return node
    if (node.name !== 'Script') return { ...node, children: node.children.map(swap) }
    const name = `Script${components.length + 1}`
    components.push(`function ${name}() {\n${indent(textOf(node))}\n  return view()\n}`)
    const drawn: WsxElement = { kind: 'element', name, props: {}, children: [] }
    const title = node.props.title
    return typeof title === 'string'
      ? { kind: 'element', name: 'Section', props: { title }, children: [drawn] }
      : drawn
  }
  const swapped = swap(root) as WsxElement
  if (components.length === 0 || root.prelude) return null
  const uses = (word: RegExp) => components.some((code) => word.test(code))
  const prelude = [IMPORTS, ...(uses(/\bnow\(/) ? [NOW] : []), ...components].join('\n\n')
  return serialize({ ...swapped, prelude: { source: prelude, components: [] } })
}

/** A Script that would not move keeps its code, readable, where it stood. */
function scriptsAsCodeBlocks(root: WsxElement): string {
  const swap = (node: WsxNode): WsxNode => {
    if (node.kind !== 'element') return node
    if (node.name !== 'Script') return { ...node, children: node.children.map(swap) }
    return {
      kind: 'element',
      name: 'Code',
      props: { lang: 'tsx' },
      children: [{ kind: 'text', value: textOf(node) }],
    }
  }
  return serialize(swap(root))
}

/**
 * Once per workspace: `<Script>` left the registry when pages began to run (D100). Each page that
 * held one is rewritten, quietly, into a page that runs the same code, or else keeps its scripts as
 * code blocks — whichever checks — so nothing written is lost.
 */
export function liftScriptsIntoCode(ws: Workspace): void {
  if (getAppMeta(ws, MIGRATED)) return
  let isDone = true
  for (const sheet of everySheetSource(ws)) {
    if (!sheet.source.includes('<Script')) continue
    let root: WsxElement
    try {
      root = parse(sheet.source)
    } catch {
      continue
    }
    const moved = scriptsAsCode(root)
    if (moved === null) continue
    const source = [moved, scriptsAsCodeBlocks(root)].find((each) => checkSource(each).ok)
    // Only what checks is written. A page wrong in some other way keeps its Scripts and is tried
    // again at the next open, until someone fixes it — never stored invalid, never forgotten.
    if (source) rewriteSourceQuietly(ws, sheet.id, source, lookOf(root))
    else isDone = false
  }
  if (isDone) setAppMeta(ws, MIGRATED, '1')
}
