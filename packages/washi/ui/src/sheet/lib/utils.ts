import type { SheetDetail } from '@washi/domain'
import { serialize, type WsxElement, type WsxNode } from '@washi/wsx'
import { api } from '../../api'
import { useSheetsStore } from '../../stores'

function swap(node: WsxNode, from: WsxElement, to: WsxElement): WsxNode {
  if (node === from) return to
  if (node.kind !== 'element') return node
  return { ...node, children: node.children.map((child) => swap(child, from, to)) }
}

/** Saves the page with one element replaced; the list refresh reloads the page with it. */
export async function replaceInSheet(
  sheet: SheetDetail,
  root: WsxElement,
  from: WsxElement,
  to: WsxElement,
): Promise<void> {
  const source = serialize(swap(root, from, to))
  await api.sheets.update.mutate({
    id: sheet.id,
    write: { title: sheet.title, icon: sheet.icon, source },
  })
  await useSheetsStore.getState().refresh()
}
