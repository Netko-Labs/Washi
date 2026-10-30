import { newBlock } from './convert'
import type {
  Block,
  BlockPlace,
  ColumnsBlock,
  ContainerBlock,
  Slot,
  TabSlot,
  TabsBlock,
} from './types'

export const isColumns = (block: Block | undefined): block is ColumnsBlock =>
  block?.kind === 'columns'

export const isTabs = (block: Block | undefined): block is TabsBlock => block?.kind === 'tabs'

export const isContainer = (block: Block | undefined): block is ContainerBlock =>
  isColumns(block) || isTabs(block)

const slotsOf = (block: ContainerBlock): Slot[] => (isColumns(block) ? block.columns : block.tabs)

function mapSlots(block: ContainerBlock, change: (slot: Slot) => Block[]): ContainerBlock {
  if (isColumns(block)) {
    return { ...block, columns: block.columns.map((slot) => ({ ...slot, blocks: change(slot) })) }
  }
  return { ...block, tabs: block.tabs.map((slot) => ({ ...slot, blocks: change(slot) })) }
}

/** The tab a strip shows: the one picked, else the first. */
export const shownTab = (block: TabsBlock, tabId: string | undefined): TabSlot | undefined =>
  block.tabs.find((tab) => tab.id === tabId) ?? block.tabs[0]

/** The list a block sits in — the page's, one column's or one tab's — and where in it. */
export function locate(blocks: Block[], id: string): BlockPlace | null {
  const at = blocks.findIndex((block) => block.id === id)
  if (at >= 0) return { list: blocks, at, parentId: null, slotId: null }
  for (const block of blocks) {
    if (!isContainer(block)) continue
    for (const slot of slotsOf(block)) {
      const inner = slot.blocks.findIndex((each) => each.id === id)
      if (inner >= 0) return { list: slot.blocks, at: inner, parentId: block.id, slotId: slot.id }
    }
  }
  return null
}

export const isNestedBlock = (blocks: Block[], id: string) => Boolean(locate(blocks, id)?.parentId)

/** The page with one list swapped for `list`; the place says which. */
export function writeList(
  blocks: Block[],
  place: Pick<BlockPlace, 'parentId' | 'slotId'>,
  list: Block[],
): Block[] {
  if (!place.parentId) return list
  return blocks.map((block) =>
    block.id === place.parentId && isContainer(block)
      ? mapSlots(block, (slot) => (slot.id === place.slotId ? list : slot.blocks))
      : block,
  )
}

/**
 * An emptied column goes; an emptied tab keeps one empty line, its label being content too.
 * Either down to one unwraps into the page, as Notion's columns do.
 */
export function tidy(blocks: Block[]): Block[] {
  return blocks.flatMap((block) => {
    if (isTabs(block)) {
      if (block.tabs.length < 2) return block.tabs[0]?.blocks ?? []
      if (block.tabs.every((tab) => tab.blocks.length > 0)) return [block]
      return [{ ...block, tabs: block.tabs.map((tab) => ({ ...tab, blocks: refill(tab.blocks) })) }]
    }
    if (!isColumns(block)) return [block]
    const columns = block.columns.filter((column) => column.blocks.length > 0)
    if (columns.length < 2) return columns[0]?.blocks ?? []
    return columns.length === block.columns.length ? [block] : [{ ...block, columns }]
  })
}

const refill = (blocks: Block[]) => (blocks.length > 0 ? blocks : [newBlock()])

/**
 * Reading order: the page top to bottom, a row of columns left to right, tabs in turn. Given what
 * each strip shows, only the tab on screen — the arrows never walk into a hidden one.
 */
export function flatten(blocks: Block[], shown?: Record<string, string>): Block[] {
  return blocks.flatMap((block) => {
    if (isTabs(block) && shown) return shownTab(block, shown[block.id])?.blocks ?? []
    return isContainer(block) ? slotsOf(block).flatMap((slot) => slot.blocks) : [block]
  })
}

/** Every block that holds no others, changed by `change`. */
export function mapBlocks(blocks: Block[], change: (block: Block) => Block): Block[] {
  return blocks.map((block) =>
    isContainer(block) ? mapSlots(block, (slot) => slot.blocks.map(change)) : change(block),
  )
}

/** The same block under new ids, down to each column's or tab's own blocks. */
export function copyBlock(block: Block): Block {
  const id = crypto.randomUUID()
  if (block.kind === 'locked') return { ...block, id, node: structuredClone(block.node) }
  if (!isContainer(block)) return { ...block, id, props: { ...block.props } }
  const copied = mapSlots(block, (slot) => slot.blocks.map(copyBlock))
  if (isColumns(copied)) {
    return {
      ...copied,
      id,
      columns: copied.columns.map((slot) => ({ ...slot, id: crypto.randomUUID() })),
    }
  }
  return { ...copied, id, tabs: copied.tabs.map((slot) => ({ ...slot, id: crypto.randomUUID() })) }
}
