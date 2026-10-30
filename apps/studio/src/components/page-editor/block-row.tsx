import { IconPlus } from '@tabler/icons-react'
import { Divider } from '@washi/paper'
import { BlockInput } from './block-input'
import { BlockMenu } from './block-menu'
import { ColumnsRow } from './columns-row'
import { type BlockRowProps, useBlockDrop, useEditorStore } from './lib'
import { LockedBlock } from './locked-block'
import { ScriptBlock } from './script-block'
import { TabsRow } from './tabs-row'

/** Blocks whose code is typed in place: what a row write runs, a formula, a Terminal's program. */
const SCRIPTED = new Set(['Automation', 'Formula', 'Terminal'])

const LINE: Record<string, string> = {
  before: '-top-px inset-x-0 h-[3px]',
  after: '-bottom-px inset-x-0 h-[3px]',
  left: '-left-2 inset-y-0 w-[3px]',
  right: '-right-2 inset-y-0 w-[3px]',
}

export function BlockRow({ block, numberAt, rootProps, isNested }: BlockRowProps) {
  const drop = useBlockDrop(block.id)

  return (
    <div
      role="group"
      className="group/block relative"
      data-block-row
      onDragOver={drop.onDragOver}
      onDrop={drop.onDrop}
    >
      {/* The whole gutter beside the block, full height: the pointer never leaves the row on its way. */}
      <div
        className={`absolute inset-y-0 hidden items-start justify-end gap-0.5 font-sans group-focus-within/block:flex group-hover/block:flex ${
          isNested ? '-left-7 w-7 pr-1' : '-left-14 w-14 pr-1.5'
        }`}
      >
        {!isNested && (
          <button
            type="button"
            aria-label="Add a block below"
            onClick={() => useEditorStore.getState().insertAfter(block.id)}
            className="grid size-6 place-items-center rounded text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
          >
            <IconPlus className="size-4" />
          </button>
        )}
        <BlockMenu block={block} />
      </div>
      {drop.place && (
        <span
          aria-hidden
          className={`pointer-events-none absolute z-20 rounded-full bg-primary ${LINE[drop.place]}`}
        />
      )}
      {block.kind === 'locked' && SCRIPTED.has(block.node.name) && (
        <ScriptBlock block={block} rootProps={rootProps} />
      )}
      {block.kind === 'locked' && !SCRIPTED.has(block.node.name) && (
        <LockedBlock block={block} rootProps={rootProps} />
      )}
      {block.kind === 'columns' && <ColumnsRow block={block} rootProps={rootProps} />}
      {block.kind === 'tabs' && <TabsRow block={block} rootProps={rootProps} />}
      {block.kind === 'divider' && <Divider />}
      {'text' in block && block.kind !== 'divider' && (
        <BlockInput block={block} numberAt={numberAt} />
      )}
    </div>
  )
}
