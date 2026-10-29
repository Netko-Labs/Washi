import { MAX_TAB_LABEL, MAX_TABS } from './constants'
import { newBlock } from './convert'
import { isTabs } from './slots'
import type { Block, TabSlot, TabsBlock } from './types'

export const tabSlot = (label: string): TabSlot => ({
  id: crypto.randomUUID(),
  label,
  props: {},
  blocks: [newBlock()],
})

/** What `/tabs` drops in: two tabs, each an empty line to type into. */
export const newTabs = (): TabsBlock => ({
  id: crypto.randomUUID(),
  kind: 'tabs',
  props: {},
  tabs: [tabSlot('Tab 1'), tabSlot('Tab 2')],
})

/** `Tab N`, N the first number past the count that no tab already wears. */
function nextLabel(tabs: TabSlot[]): string {
  const taken = new Set(tabs.map((tab) => tab.label))
  let n = tabs.length + 1
  while (taken.has(`Tab ${n}`)) n++
  return `Tab ${n}`
}

function withTabs(blocks: Block[], tabsId: string, change: (block: TabsBlock) => TabsBlock) {
  return blocks.map((block) => (block.id === tabsId && isTabs(block) ? change(block) : block))
}

/** A new tab at the end, or null when the strip is full. */
export function withNewTab(blocks: Block[], tabsId: string) {
  const block = blocks.find((each) => each.id === tabsId)
  if (!isTabs(block) || block.tabs.length >= MAX_TABS) return null
  const tab = tabSlot(nextLabel(block.tabs))
  return {
    tab,
    blocks: withTabs(blocks, tabsId, (each) => ({ ...each, tabs: [...each.tabs, tab] })),
  }
}

/** A blank name keeps the old one: a label is never empty. */
export function withTabLabel(blocks: Block[], tabsId: string, tabId: string, label: string) {
  const name = label.trim().slice(0, MAX_TAB_LABEL)
  if (!name) return blocks
  return withTabs(blocks, tabsId, (block) => ({
    ...block,
    tabs: block.tabs.map((tab) => (tab.id === tabId ? { ...tab, label: name } : tab)),
  }))
}

export function withTabMoved(blocks: Block[], tabsId: string, tabId: string, step: -1 | 1) {
  return withTabs(blocks, tabsId, (block) => {
    const at = block.tabs.findIndex((tab) => tab.id === tabId)
    const to = at + step
    if (at < 0 || to < 0 || to >= block.tabs.length) return block
    const tabs = [...block.tabs]
    ;[tabs[at], tabs[to]] = [tabs[to] as TabSlot, tabs[at] as TabSlot]
    return { ...block, tabs }
  })
}

/** Untidied: `tidy` unwraps a strip left with one tab. */
export function withoutTab(blocks: Block[], tabsId: string, tabId: string) {
  return withTabs(blocks, tabsId, (block) => ({
    ...block,
    tabs: block.tabs.filter((tab) => tab.id !== tabId),
  }))
}
