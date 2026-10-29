import type { StoreApi } from 'zustand'
import { newBlock } from './convert'
import { tidy } from './slots'
import { withNewTab, withoutTab, withTabLabel, withTabMoved } from './tabs'
import type { EditorState, TabActions } from './types'

/** The editor store's tab strip: which tab shows, and the tabs themselves. */
export function tabActions(
  set: StoreApi<EditorState>['setState'],
  get: StoreApi<EditorState>['getState'],
): TabActions {
  return {
    shownTabs: {},
    showTab: (tabsId, tabId) =>
      set(({ shownTabs }) => ({ shownTabs: { ...shownTabs, [tabsId]: tabId } })),
    addTab: (tabsId) => {
      const added = withNewTab(get().blocks, tabsId)
      const first = added?.tab.blocks[0]
      if (!added || !first) return
      set(({ shownTabs }) => ({
        blocks: added.blocks,
        shownTabs: { ...shownTabs, [tabsId]: added.tab.id },
        focus: { id: first.id, caret: 0 },
      }))
    },
    renameTab: (tabsId, tabId, label) =>
      set(({ blocks }) => ({ blocks: withTabLabel(blocks, tabsId, tabId, label) })),
    moveTab: (tabsId, tabId, step) =>
      set(({ blocks }) => ({ blocks: withTabMoved(blocks, tabsId, tabId, step) })),
    removeTab: (tabsId, tabId) =>
      set(({ blocks }) => {
        const next = tidy(withoutTab(blocks, tabsId, tabId))
        return { blocks: next.length > 0 ? next : [newBlock()] }
      }),
  }
}
