import { MAX_COLUMNS, MAX_RATIO } from './constants'
import type { Block, BlockPlace, ColumnSlot, ColumnsBlock, DropPlace } from './types'

export const isColumns = (block: Block | undefined): block is ColumnsBlock =>
  block?.kind === 'columns'

/** The list a block sits in — the page's, or one column's — and where in it. */
export function locate(blocks: Block[], id: string): BlockPlace | null {
  const at = blocks.findIndex((block) => block.id === id)
  if (at >= 0) return { list: blocks, at, columnsId: null, columnId: null }
  for (const block of blocks) {
    if (!isColumns(block)) continue
    for (const column of block.columns) {
      const inner = column.blocks.findIndex((each) => each.id === id)
      if (inner >= 0) {
        return { list: column.blocks, at: inner, columnsId: block.id, columnId: column.id }
      }
    }
  }
  return null
}

/** The page with one list swapped for `list`; the place says which. */
export function writeList(
  blocks: Block[],
  place: Pick<BlockPlace, 'columnsId' | 'columnId'>,
  list: Block[],
): Block[] {
  if (!place.columnsId) return list
  return blocks.map((block) =>
    block.id === place.columnsId && isColumns(block)
      ? {
          ...block,
          columns: block.columns.map((column) =>
            column.id === place.columnId ? { ...column, blocks: list } : column,
          ),
        }
      : block,
  )
}

/** An emptied column goes; columns down to one unwrap into the page, as Notion's do. */
export function tidy(blocks: Block[]): Block[] {
  return blocks.flatMap((block) => {
    if (!isColumns(block)) return [block]
    const columns = block.columns.filter((column) => column.blocks.length > 0)
    if (columns.length < 2) return columns[0]?.blocks ?? []
    return columns.length === block.columns.length ? [block] : [{ ...block, columns }]
  })
}

/** Reading order: the page top to bottom, a row of columns left to right. */
export function flatten(blocks: Block[]): Block[] {
  return blocks.flatMap((block) =>
    isColumns(block) ? block.columns.flatMap((column) => column.blocks) : [block],
  )
}

/** Every block that is not a row of columns, changed by `change`. */
export function mapBlocks(blocks: Block[], change: (block: Block) => Block): Block[] {
  return blocks.map((block) =>
    isColumns(block)
      ? {
          ...block,
          columns: block.columns.map((column) => ({
            ...column,
            blocks: column.blocks.map(change),
          })),
        }
      : change(block),
  )
}

const slot = (blocks: Block[], ratio = 1): ColumnSlot => ({
  id: crypto.randomUUID(),
  ratio,
  props: {},
  blocks,
})

function beside(row: ColumnsBlock, at: number, dragged: Block, place: DropPlace): ColumnsBlock {
  const ratio = Math.max(
    1,
    Math.round(row.columns.reduce((sum, column) => sum + column.ratio, 0) / row.columns.length),
  )
  const index = place === 'left' ? at : at + 1
  const columns = [...row.columns]
  columns.splice(index, 0, slot([dragged], ratio))
  return { ...row, columns }
}

/**
 * Moves a block above, below or beside another. Beside a page-level block the two become columns;
 * beside one in a column, a new column opens next to it. Rows of columns never nest.
 */
export function moveBlock(blocks: Block[], dragId: string, targetId: string, place: DropPlace) {
  const from = locate(blocks, dragId)
  const dragged = from?.list[from.at]
  if (!from || !dragged || dragId === targetId) return blocks
  const without = writeList(
    blocks,
    from,
    from.list.filter((block) => block.id !== dragId),
  )
  const to = locate(without, targetId)
  const target = to?.list[to.at]
  if (!to || !target) return blocks
  const isSide = place === 'left' || place === 'right'
  if (isColumns(dragged) && (to.columnsId || (isSide && isColumns(target)))) return blocks

  if (isSide && isColumns(target) && target.columns.length < MAX_COLUMNS) {
    const edge = place === 'left' ? 0 : target.columns.length - 1
    const grown = beside(target, edge, dragged, place)
    return tidy(without.map((block) => (block.id === target.id ? grown : block)))
  }
  if (isSide && !to.columnsId && !isColumns(target) && !isColumns(dragged)) {
    const pair = place === 'left' ? [dragged, target] : [target, dragged]
    const row: ColumnsBlock = {
      id: crypto.randomUUID(),
      kind: 'columns',
      props: {},
      columns: pair.map((block) => slot([block])),
    }
    return tidy(without.map((block) => (block.id === target.id ? row : block)))
  }
  const row = to.columnsId ? without.find((block) => block.id === to.columnsId) : undefined
  if (isSide && isColumns(row) && row.columns.length < MAX_COLUMNS) {
    const at = row.columns.findIndex((column) => column.id === to.columnId)
    const grown = beside(row, at, dragged, place)
    return tidy(without.map((block) => (block.id === row.id ? grown : block)))
  }
  const list = [...to.list]
  list.splice(place === 'before' || place === 'left' ? to.at : to.at + 1, 0, dragged)
  return tidy(writeList(without, to, list))
}

const gcd = (a: number, b: number): number => (b === 0 ? a : gcd(b, a % b))

/**
 * Drags the gap after column `index`: `fraction` is where it sits across that column and the next.
 * Shares are scaled up first so a 1:1 pair can move in sixths, then reduced again.
 */
export function resizeColumns(
  blocks: Block[],
  columnsId: string,
  index: number,
  fraction: number,
): Block[] {
  return blocks.map((block) => {
    if (block.id !== columnsId || !isColumns(block)) return block
    const ratios = block.columns.map((column) => column.ratio)
    const pair = (ratios[index] ?? 1) + (ratios[index + 1] ?? 1)
    const scale = Math.max(
      1,
      Math.min(Math.floor(MAX_RATIO / pair), ...ratios.map((r) => Math.floor(MAX_RATIO / r))),
    )
    const scaled = ratios.map((ratio) => ratio * scale)
    const sum = pair * scale
    const left = Math.min(MAX_RATIO, Math.max(1, sum - MAX_RATIO, Math.round(sum * fraction)))
    scaled[index] = Math.min(left, sum - 1)
    scaled[index + 1] = sum - (scaled[index] ?? 1)
    const common = scaled.reduce(gcd)
    return {
      ...block,
      columns: block.columns.map((column, at) => ({
        ...column,
        ratio: (scaled[at] ?? common) / common,
      })),
    }
  })
}

/** Column `index`'s part of it and the next, in percent. */
export function shareOf(row: ColumnsBlock, index: number): number {
  const left = row.columns[index]?.ratio ?? 1
  const right = row.columns[index + 1]?.ratio ?? 1
  return Math.round((left / (left + right)) * 100)
}
