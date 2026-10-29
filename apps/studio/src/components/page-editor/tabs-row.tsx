import { IconPlus } from '@tabler/icons-react'
import { BlockList } from './block-list'
import { MAX_TABS, shownTab, type TabsRowProps, useEditorStore } from './lib'
import { TabLabel } from './tab-label'

/** Tab sections, each typed into like the page. Every panel stays mounted; one shows. */
export function TabsRow({ block, rootProps }: TabsRowProps) {
  const shown = useEditorStore((state) => state.shownTabs[block.id])
  const active = shownTab(block, shown)

  return (
    <div className="wsx-tabs">
      <div className="wsx-tabs-list" role="tablist">
        {block.tabs.map((tab) => (
          <TabLabel key={tab.id} tabsId={block.id} tab={tab} isActive={tab === active} />
        ))}
        {block.tabs.length < MAX_TABS && (
          <button
            type="button"
            aria-label="Add a tab"
            onClick={() => useEditorStore.getState().addTab(block.id)}
            className="grid size-8 shrink-0 place-items-center self-center rounded text-muted-foreground hover:bg-black/5 dark:hover:bg-white/10"
          >
            <IconPlus className="size-4" />
          </button>
        )}
      </div>
      {block.tabs.map((tab) => (
        <div key={tab.id} role="tabpanel" aria-label={tab.label} hidden={tab !== active}>
          <div className="wsx-tab">
            <BlockList blocks={tab.blocks} rootProps={rootProps} />
          </div>
        </div>
      ))}
    </div>
  )
}
