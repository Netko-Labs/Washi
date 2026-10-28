import { useSheetsStore } from '@washi/ui'
import type { WsxElement } from '@washi/wsx'
import { create } from 'zustand'
import { api } from '@/integrations/trpc'
import { flatten, locate, mapBlocks, moveBlock, resizeColumns, tidy, writeList } from './columns'
import { lockedBlock, newBlock, reconcile, turnInto } from './convert'
import type { Block, BlockPlace, EditorState, FocusRequest, TextBlock } from './types'
import { applyShortcut, dataNode, swapNode } from './utils'
import { LIST_MARKERS, NEW_DATABASE, NEW_SUBPAGE_SOURCE } from './values'

function isTyped(block: Block | undefined): block is TextBlock {
  return (
    block !== undefined &&
    block.kind !== 'locked' &&
    block.kind !== 'columns' &&
    block.kind !== 'divider'
  )
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
      const first = get().focusFirst ? flatten(loaded).find(isTyped) : undefined
      set({
        blocks: loaded,
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
          const before = flatten(get().blocks)
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
      const order = flatten(get().blocks)
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
      const order = flatten(get().blocks)
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
      if (pick.kind === 'embed' && !pick.src) throw new Error('paste an https address after /embed')
      if (pick.kind === 'database') {
        await api.tables.define.mutate({ spec: NEW_DATABASE(pick.name) })
      }
      let node = pick.kind === 'subpage' ? null : dataNode(pick)
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
  }
})
