import { IconPlus } from '@tabler/icons-react'
import { Divider } from '@washi/paper'
import { BlockInput } from './block-input'
import { BlockMenu } from './block-menu'
import { type BlockRowProps, useEditorStore } from './lib'
import { LockedBlock } from './locked-block'

export function BlockRow({ block, numberAt, rootProps }: BlockRowProps) {
  return (
    <div className="group/block relative">
      {/* The whole gutter beside the block, full height: the pointer never leaves the row on its way. */}
      <div className="-left-14 absolute inset-y-0 hidden w-14 items-start justify-end gap-0.5 pr-1.5 font-sans group-focus-within/block:flex group-hover/block:flex">
        <button
          type="button"
          aria-label="Add a block below"
          onClick={() => useEditorStore.getState().insertAfter(block.id)}
          className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
        >
          <IconPlus className="size-4" />
        </button>
        <BlockMenu block={block} />
      </div>
      {block.kind === 'locked' && <LockedBlock block={block} rootProps={rootProps} />}
      {block.kind === 'divider' && <Divider />}
      {block.kind !== 'locked' && block.kind !== 'divider' && (
        <BlockInput block={block} numberAt={numberAt} />
      )}
    </div>
  )
}
