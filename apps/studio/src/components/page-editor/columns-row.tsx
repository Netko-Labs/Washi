import { Fragment } from 'react'
import { BlockList } from './block-list'
import { ColumnGap } from './column-gap'
import { type ColumnsRowProps, shareOf } from './lib'

/** A row of columns, each typed into like the page; the gaps between them resize. */
export function ColumnsRow({ block, rootProps }: ColumnsRowProps) {
  return (
    <div className="page-editor-cols">
      {block.columns.map((column, index) => (
        <Fragment key={column.id}>
          {index > 0 && (
            <ColumnGap columnsId={block.id} index={index - 1} share={shareOf(block, index - 1)} />
          )}
          <div className="min-w-0" style={{ flex: `${column.ratio} 1 0` }}>
            <BlockList blocks={column.blocks} rootProps={rootProps} isNested />
          </div>
        </Fragment>
      ))}
    </div>
  )
}
