import { SheetFrame } from '@washi/paper'
import { BlockRow } from './block-row'
import {
  frameOf,
  numberedPositions,
  type PageEditorProps,
  useAutosave,
  useEditorStore,
  useLoadBlocks,
} from './lib'

/** The page as blocks: type into text, Enter for the next block, `/` or `#`, `-`, `[]` to change kind. */
export function PageEditor({ sheet, root }: PageEditorProps) {
  const blocks = useEditorStore((state) => state.blocks)
  useLoadBlocks(sheet.id, root)
  useAutosave(sheet, root)
  const numbers = numberedPositions(blocks)

  return (
    <SheetFrame {...frameOf(root)}>
      {blocks.map((block, index) => (
        <BlockRow
          key={block.id}
          block={block}
          numberAt={numbers[index] ?? 0}
          rootProps={root.props}
        />
      ))}
      <button
        type="button"
        aria-label="Add a block at the end"
        onClick={() => {
          const last = blocks.at(-1)
          if (last) useEditorStore.getState().insertAfter(last.id)
        }}
        className="block h-24 w-full cursor-text"
      />
    </SheetFrame>
  )
}
