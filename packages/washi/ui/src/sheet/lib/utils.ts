import type { SheetDetail } from '@washi/domain'
import { serialize, type WsxElement, type WsxNode } from '@washi/wsx'
import { api } from '../../api'
import { useSheetsStore } from '../../stores'
import type { ShownSheet } from './types'

function swap(node: WsxNode, from: WsxElement, to: WsxElement): WsxNode {
  if (node === from) return to
  if (node.kind !== 'element') return node
  // Untouched elements keep their identity: the next swap still finds its block by reference.
  const children = node.children.map((child) => swap(child, from, to))
  return children.every((child, index) => child === node.children[index])
    ? node
    : { ...node, children }
}

/**
 * Writes one loaded page, element by element. Until the page reloads, a block still holds the
 * element it was rendered from, so every swap is followed forward to the latest one, and the
 * saves go out one after another — a quick second edit builds on the first, never over it.
 */
export function pageWriter(sheet: SheetDetail, loaded: WsxElement) {
  let root = loaded
  let version = sheet.version
  const replaced = new Map<WsxElement, WsxElement>()
  let saving: Promise<void> = Promise.resolve()

  return (from: WsxElement, to: WsxElement): Promise<void> => {
    let current = from
    for (let next = replaced.get(current); next; next = replaced.get(current)) current = next
    replaced.set(current, to)
    root = swap(root, current, to) as WsxElement
    const source = serialize(root)
    saving = saving
      .catch(() => undefined)
      .then(async () => {
        // With the version it was drawn from, a canvas edit merges with a teammate's typing.
        const saved = await api.sheets.update.mutate({
          id: sheet.id,
          write: { title: sheet.title, source },
          baseVersion: version,
        })
        version = saved.version
        await useSheetsStore.getState().refresh()
      })
    return saving
  }
}

/**
 * The page on screen at the stamp it was loaded at, so the list catching up to it reloads
 * nothing. Every load that starts forgets it: a load cut short leaves nothing to match.
 */
export function shownSheet(): ShownSheet {
  let drawn: SheetDetail | null = null
  return {
    isDrawn: (id, version) => drawn?.id === id && drawn.hlcUpdated === version,
    loading: () => {
      drawn = null
    },
    drawn: (sheet) => {
      drawn = sheet
    },
  }
}
