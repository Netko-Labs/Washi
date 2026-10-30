import { useSheetsStore } from '@washi/ui'
import type { WsxElement } from '@washi/wsx'
import { create } from 'zustand'
import { api } from '@/integrations/trpc'
import { moveBlock, resizeColumns } from './columns'
import { lockedBlock, newBlock, reconcile, turnInto } from './convert'
import { flatten, isNestedBlock, locate, mapBlocks, tidy, writeList } from './slots'
import { tabActions } from './tab-actions'
import { newTabs } from './tabs'
import type { Block, BlockPlace, EditorState, FocusRequest, TextBlock } from './types'
import { uploaded, uploadedGallery } from './upload-blocks'
import { applyShortcut, bookmarkNode, dataNode, swapNode, withWidgetCode } from './utils'
import { LIST_MARKERS, NEW_DATABASE, NEW_SUBPAGE_SOURCE } from './values'

function isTyped(block: Block | undefined): block is TextBlock {
  return block !== undefined && 'text' in block && block.kind !== 'divider'
}

/** The page being typed into: every row reads its own block and calls these to change the page. */
export const useEditorStore = create<EditorState>((set, get) => {
  const replace = (id: string, next: (block: TextBlock) => Block) =>
    set(({ blocks }) => ({
      blocks: mapBlocks(blocks, (block) =>
        block.id === id && isTyped(block) ? next(block) : block,
      ),
    }))
  /** Rewrites the list `id` sits in — the page's or one column's — and tidies the columns after. */
  const inList = (
    id: string,
    change: (place: BlockPlace) => { list: Block[]; focus?: FocusRequest | null } | null,
  ) => {
    const { blocks } = get()
    const place = locate(blocks, id)
    const changed = place && change(place)
    if (!place || !changed) return
    const next = tidy(writeList(blocks, place, changed.list))
    set({
      blocks: next.length > 0 ? next : [newBlock()],
      ...(changed.focus !== undefined && { focus: changed.focus }),
    })
  }

  return {
    editingId: null,
    mode: 'blocks',
    blocks: [],
    focus: null,
    saveState: 'saved',
    focusFirst: false,
    startEditing: (editingId, focus = false, mode = 'blocks') =>
      set({ editingId, mode, saveState: 'saved', focusFirst: focus }),
    setMode: (mode) => set({ mode, saveState: 'saved' }),
    // Blocks stay until the next load: the editor's last save still reads them as it unmounts.
    stopEditing: () => set({ editingId: null, focus: null, dragging: null, drop: null }),
    version: null,
    savedSource: null,
    load: (blocks, version = null, source = null) => {
      const loaded = blocks.length > 0 ? blocks : [newBlock()]
      const first = get().focusFirst ? flatten(loaded, {}).find(isTyped) : undefined
      set({
        blocks: loaded,
        shownTabs: {},
        focus: first ? { id: first.id, caret: 'end' } : null,
        saveState: 'saved',
        version,
        savedSource: source,
      })
    },
    absorb: (blocks, version, source) =>
      set((state) => ({ blocks: reconcile(state.blocks, blocks), version, savedSource: source })),

    setText: (id, text) =>
      replace(id, (block) => applyShortcut({ ...block, text }) ?? { ...block, text }),
    dropSlash: (id, typed) => {
      const place = locate(get().blocks, id)
      const block = place?.list[place.at]
      if (isTyped(block) && block.text === typed) replace(id, () => ({ ...block, text: '' }))
    },
    setDone: (id, done) => replace(id, (block) => ({ ...block, done })),
    turnInto: (id, kind) => {
      replace(id, (block) => turnInto(block, kind))
      set({ focus: { id, caret: 'end' } })
    },

    splitAt: (id, caret) =>
      inList(id, ({ list, at }) => {
        const block = list[at]
        if (!isTyped(block)) return null
        if (LIST_MARKERS[block.kind] && !block.text) {
          return { list: list.map((each) => (each.id === id ? turnInto(block, 'text') : each)) }
        }
        const keeps = LIST_MARKERS[block.kind] !== undefined
        const next = newBlock(keeps ? block.kind : 'text', block.text.slice(caret))
        const head = { ...block, text: block.text.slice(0, caret) }
        return {
          list: [...list.slice(0, at), head, next, ...list.slice(at + 1)],
          focus: { id: next.id, caret: 0 },
        }
      }),

    mergeBack: (id) =>
      inList(id, ({ list, at }) => {
        const block = list[at]
        if (!isTyped(block)) return null
        if (block.kind !== 'text') {
          const plain = { ...turnInto(block, 'text'), text: block.text }
          return {
            list: list.map((each) => (each.id === id ? plain : each)),
            focus: { id, caret: 0 },
          }
        }
        const previous = list[at - 1]
        if (isTyped(previous)) {
          const joined = { ...previous, text: previous.text + block.text }
          return {
            list: list
              .filter((each) => each.id !== id)
              .map((each) => (each.id === previous.id ? joined : each)),
            focus: { id: previous.id, caret: previous.text.length },
          }
        }
        // An empty first block of a column goes, and with it the column.
        if ((previous || list.length === 1) && !block.text) {
          const before = flatten(get().blocks, get().shownTabs)
          const neighbour = before
            .slice(
              0,
              before.findIndex((each) => each.id === id),
            )
            .reverse()
            .find(isTyped)
          return {
            list: list.filter((each) => each.id !== id),
            focus: neighbour ? { id: neighbour.id, caret: 'end' } : null,
          }
        }
        return null
      }),

    insertAfter: (id) =>
      inList(id, ({ list, at }) => {
        const next = newBlock()
        return {
          list: [...list.slice(0, at + 1), next, ...list.slice(at + 1)],
          focus: { id: next.id, caret: 0 },
        }
      }),

    remove: (id) => {
      const order = flatten(get().blocks, get().shownTabs)
      const at = order.findIndex((block) => block.id === id)
      const neighbour =
        order.slice(0, Math.max(at, 0)).reverse().find(isTyped) ?? order.slice(at + 1).find(isTyped)
      inList(id, ({ list }) => ({
        list: list.filter((block) => block.id !== id),
        focus: neighbour ? { id: neighbour.id, caret: 'end' } : null,
      }))
    },

    move: (id, step) =>
      inList(id, ({ list, at }) => {
        const to = at + step
        if (to < 0 || to >= list.length) return null
        const next = [...list]
        ;[next[at], next[to]] = [next[to] as Block, next[at] as Block]
        return { list: next }
      }),

    moveFocus: (id, step) => {
      const order = flatten(get().blocks, get().shownTabs)
      const at = order.findIndex((block) => block.id === id)
      const ahead = step < 0 ? order.slice(0, at).reverse() : order.slice(at + 1)
      const target = ahead.find(isTyped)
      if (target) set({ focus: { id: target.id, caret: step < 0 ? 'end' : 0 } })
    },

    setSaveState: (saveState) => set({ saveState }),

    replaceInBlock: (id, from, to) =>
      set(({ blocks }) => ({
        blocks: mapBlocks(blocks, (block) =>
          block.id === id && block.kind === 'locked'
            ? { ...block, node: swapNode(block.node, from, to) as WsxElement }
            : block,
        ),
      })),

    tables: [],
    setTables: (tables) => set({ tables }),
    insertData: async (id, pick) => {
      if (!locate(get().blocks, id)) return
      // A page's code sits above its markup, so it is written where the whole page is: the source.
      if (pick.kind === 'code') {
        inList(id, ({ list, at }) => ({ list: [...list.slice(0, at), ...list.slice(at + 1)] }))
        set({ mode: 'source' })
        return
      }
      if (pick.kind === 'tabs') {
        if (isNestedBlock(get().blocks, id))
          throw new Error('tabs sit on the page itself, not in a column or a tab')
        const made = newTabs()
        const first = made.tabs[0]?.blocks[0]
        inList(id, ({ list, at }) => ({
          list: [...list.slice(0, at), made, newBlock(), ...list.slice(at + 1)],
          focus: first ? { id: first.id, caret: 0 } : null,
        }))
        return
      }
      if (pick.kind === 'embed' && !pick.src) throw new Error('paste an https address after /embed')
      if (pick.kind === 'bookmark' && !pick.href) {
        throw new Error('paste an https address after /bookmark')
      }
      if (pick.kind === 'database') {
        await api.tables.define.mutate({ spec: NEW_DATABASE(pick.name) })
      }
      const isLater = ['subpage', 'bookmark', 'upload', 'gallery'].includes(pick.kind)
      let node = isLater ? null : dataNode(pick)
      if (pick.kind === 'upload') node = await uploaded(pick.as, pick.file)
      if (pick.kind === 'gallery') node = await uploadedGallery(pick.files ?? [])
      if (pick.kind === 'bookmark') {
        // Read once now and kept as the page's own words; a site that will not answer is just its link.
        const seen = await api.links.preview.mutate({ href: pick.href }).catch(() => null)
        node = bookmarkNode(pick.href, seen)
      }
      if (pick.kind === 'subpage') {
        // Made under the page being typed into, linked where the `/` was; the typing carries on here.
        const made = await api.sheets.create.mutate({
          write: { title: 'Untitled', source: NEW_SUBPAGE_SOURCE },
          parentId: get().editingId,
        })
        void useSheetsStore.getState().refresh()
        node = dataNode({ kind: 'link', sheet: made.id })
      }
      if (!node) return
      // The clock's component is page code: the next save carries it above the page, and a page
      // with code is edited as its source from then on.
      const { savedSource } = get()
      if (pick.kind === 'widget' && savedSource) set({ savedSource: withWidgetCode(savedSource) })
      const next = newBlock()
      const landed = [lockedBlock(node), next]
      // The `/` block may have gone while the table or page was made: what was made lands last.
      if (!locate(get().blocks, id)) {
        set(({ blocks }) => ({ blocks: [...blocks, ...landed], focus: { id: next.id, caret: 0 } }))
        return
      }
      inList(id, ({ list, at }) => ({
        list: [...list.slice(0, at), ...landed, ...list.slice(at + 1)],
        focus: { id: next.id, caret: 0 },
      }))
    },

    dragging: null,
    drop: null,
    setDragging: (dragging) => set({ dragging, drop: null }),
    setDrop: (drop) => {
      const current = get().drop
      if (current?.id !== drop?.id || current?.place !== drop?.place) set({ drop })
    },
    moveTo: (id, targetId, place) =>
      set(({ blocks }) => ({
        blocks: moveBlock(blocks, id, targetId, place),
        dragging: null,
        drop: null,
      })),
    resize: (columnsId, index, fraction) =>
      set(({ blocks }) => ({ blocks: resizeColumns(blocks, columnsId, index, fraction) })),
    ...tabActions(set, get),
  }
})
