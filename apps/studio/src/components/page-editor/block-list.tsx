import { BlockRow } from './block-row'
import { type BlockListProps, numberedPositions } from './lib'

/** A run of blocks — the page's, or one column's — each numbered within its own run. */
export function BlockList({ blocks, rootProps, isNested }: BlockListProps) {
  const numbers = numberedPositions(blocks)
  return blocks.map((block, index) => (
    <BlockRow
      key={block.id}
      block={block}
      numberAt={numbers[index] ?? 0}
      rootProps={rootProps}
      isNested={isNested}
    />
  ))
}
