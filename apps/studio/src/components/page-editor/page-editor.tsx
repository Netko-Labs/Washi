import { frameOf, SheetFrame } from '@washi/paper'
import { BlockList } from './block-list'
import { type PageEditorProps, useAutosave, useEditorStore, useLoadBlocks } from './lib'

/** The page as blocks: type into text, Enter for the next block, `/` or `#`, `-`, `[]` to change kind. */
export function PageEditor({ sheet, root }: PageEditorProps) {
  const blocks = useEditorStore((state) => state.blocks)
  useLoadBlocks(sheet, root)
  useAutosave(sheet, root)

  return (
    <SheetFrame {...frameOf(root)}>
      <BlockList blocks={blocks} rootProps={root.props} />
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
