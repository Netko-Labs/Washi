import { MAX_COLUMNS, MAX_RATIO } from './constants'
import { isColumns, isContainer, locate, tidy, writeList } from './slots'
import type { Block, ColumnSlot, ColumnsBlock, DropPlace } from './types'

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
 * beside one in a column, a new column opens next to it; beside one in a tab, it lands below.
 * Columns and tabs never nest, in each other or themselves.
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
  if (isContainer(dragged) && (to.parentId || (isSide && isContainer(target)))) return blocks

  if (isSide && isColumns(target) && target.columns.length < MAX_COLUMNS) {
    const edge = place === 'left' ? 0 : target.columns.length - 1
    const grown = beside(target, edge, dragged, place)
    return tidy(without.map((block) => (block.id === target.id ? grown : block)))
  }
  if (isSide && !to.parentId && !isContainer(target) && !isContainer(dragged)) {
    const pair = place === 'left' ? [dragged, target] : [target, dragged]
    const row: ColumnsBlock = {
      id: crypto.randomUUID(),
      kind: 'columns',
      props: {},
      columns: pair.map((block) => slot([block])),
    }
    return tidy(without.map((block) => (block.id === target.id ? row : block)))
  }
  const row = to.parentId ? without.find((block) => block.id === to.parentId) : undefined
  if (isSide && isColumns(row) && row.columns.length < MAX_COLUMNS) {
    const at = row.columns.findIndex((column) => column.id === to.slotId)
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
