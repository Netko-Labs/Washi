import { type SidebarTreeProps, useTreeNav } from './lib'
import { SidebarTreeNode } from './sidebar-tree-node'
import { TreeNotice } from './tree-notice'

/** Pages as Notion nests them: drag a row onto another to file it inside, or between to reorder. */
export function SidebarTree(props: SidebarTreeProps) {
  const { groups, tabStop, onKeyDown } = useTreeNav()

  return (
    <>
      <div role="tree" aria-label="Pages" className="space-y-px" onKeyDown={onKeyDown}>
        {(groups.get(null) ?? []).map((sheet) => (
          <SidebarTreeNode
            {...props}
            key={sheet.id}
            sheet={sheet}
            depth={0}
            groups={groups}
            tabStop={tabStop}
          />
        ))}
      </div>
      <TreeNotice />
    </>
  )
}
