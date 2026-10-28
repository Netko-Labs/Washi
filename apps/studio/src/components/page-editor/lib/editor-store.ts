import { useSheetsStore } from '@washi/ui'
import type { WsxElement } from '@washi/wsx'
import { create } from 'zustand'
import { api } from '@/integrations/trpc'
import type { Block, EditorState, TextBlock } from './types'
import {
  applyShortcut,
  dataNode,
  lockedBlock,
  newBlock,
  reconcile,
  swapNode,
  turnInto,
} from './utils'
import { LIST_MARKERS, NEW_DATABASE, NEW_SUBPAGE_SOURCE } from './values'

function isTyped(block: Block | undefined): block is TextBlock {
  return block !== undefined && block.kind !== 'locked' && block.kind !== 'divider'
}

/** The page being typed into: every row reads its own block and calls these to change the page. */
export const useEditorStore = create<EditorState>((set, get) => {
  const replace = (id: string, next: (block: TextBlock) => Block) =>
    set(({ blocks }) => ({
      blocks: blocks.map((block) =>
        block.id === id && block.kind !== 'locked' ? next(block) : block,
      ),
    }))

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
    stopEditing: () => set({ editingId: null, focus: null }),
    version: null,
    savedSource: null,
    load: (blocks, version = null, source = null) => {
      const loaded = blocks.length > 0 ? blocks : [newBlock()]
      const first = get().focusFirst ? loaded[0] : undefined
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

    splitAt: (id, caret) => {
      const { blocks } = get()
      const at = blocks.findIndex((block) => block.id === id)
      const block = blocks[at]
      if (!isTyped(block)) return
      if (LIST_MARKERS[block.kind] && !block.text) {
        replace(id, (current) => turnInto(current, 'text'))
        return
      }
      const keeps = LIST_MARKERS[block.kind] !== undefined
      const next = newBlock(keeps ? block.kind : 'text', block.text.slice(caret))
      const head = { ...block, text: block.text.slice(0, caret) }
      set({
        blocks: [...blocks.slice(0, at), head, next, ...blocks.slice(at + 1)],
        focus: { id: next.id, caret: 0 },
      })
    },

    mergeBack: (id) => {
      const { blocks } = get()
      const at = blocks.findIndex((block) => block.id === id)
      const block = blocks[at]
      if (!isTyped(block)) return
      if (block.kind !== 'text') {
        replace(id, (current) => ({ ...turnInto(current, 'text'), text: current.text }))
        set({ focus: { id, caret: 0 } })
        return
      }
      const previous = blocks[at - 1]
      if (isTyped(previous)) {
        const caret = previous.text.length
        set({
          blocks: blocks
            .filter((each) => each.id !== id)
            .map((each) =>
              each.id === previous.id ? { ...previous, text: previous.text + block.text } : each,
            ),
          focus: { id: previous.id, caret },
        })
      } else if (previous && !block.text) {
        get().remove(id)
      }
    },

    insertAfter: (id) => {
      const { blocks } = get()
      const at = blocks.findIndex((block) => block.id === id)
      const next = newBlock()
      set({
        blocks: [...blocks.slice(0, at + 1), next, ...blocks.slice(at + 1)],
        focus: { id: next.id, caret: 0 },
      })
    },

    remove: (id) => {
      const { blocks } = get()
      const at = blocks.findIndex((block) => block.id === id)
      const left = blocks.filter((block) => block.id !== id)
      const neighbour = [...left.slice(0, at)].reverse().find(isTyped) ?? left.find(isTyped)
      set({
        blocks: left.length > 0 ? left : [newBlock()],
        focus: neighbour ? { id: neighbour.id, caret: 'end' } : null,
      })
    },

    move: (id, step) => {
      const blocks = [...get().blocks]
      const at = blocks.findIndex((block) => block.id === id)
      const to = at + step
      if (at < 0 || to < 0 || to >= blocks.length) return
      ;[blocks[at], blocks[to]] = [blocks[to] as Block, blocks[at] as Block]
      set({ blocks })
    },

    moveFocus: (id, step) => {
      const { blocks } = get()
      const at = blocks.findIndex((block) => block.id === id)
      const ordered = step < 0 ? blocks.slice(0, at).reverse() : blocks.slice(at + 1)
      const target = ordered.find(isTyped)
      if (target) set({ focus: { id: target.id, caret: step < 0 ? 'end' : 0 } })
    },

    setSaveState: (saveState) => set({ saveState }),

    replaceInBlock: (id, from, to) =>
      set(({ blocks }) => ({
        blocks: blocks.map((block) =>
          block.id === id && block.kind === 'locked'
            ? { ...block, node: swapNode(block.node, from, to) as WsxElement }
            : block,
        ),
      })),

    tables: [],
    setTables: (tables) => set({ tables }),
    insertData: async (id, pick) => {
      if (!get().blocks.some((block) => block.id === id)) return
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
      const { blocks } = get()
      const at = blocks.findIndex((block) => block.id === id)
      const next = newBlock()
      // The `/` block may have gone while the table or page was made: what was made lands last.
      const landed = [lockedBlock(node), next]
      set({
        blocks:
          at < 0
            ? [...blocks, ...landed]
            : [...blocks.slice(0, at), ...landed, ...blocks.slice(at + 1)],
        focus: { id: next.id, caret: 0 },
      })
    },
  }
})
