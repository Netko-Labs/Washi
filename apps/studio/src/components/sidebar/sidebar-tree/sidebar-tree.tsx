import { groupByParent, useSheetsStore } from '@washi/ui'
import { useMemo } from 'react'
import { type SidebarTreeProps, useRevealActive } from './lib'
import { SidebarTreeNode } from './sidebar-tree-node'
import { TreeNotice } from './tree-notice'

/** Pages as Notion nests them: drag a row onto another to file it inside, or between to reorder. */
export function SidebarTree(props: SidebarTreeProps) {
  const sheets = useSheetsStore((state) => state.sheets)
  const groups = useMemo(() => groupByParent(sheets), [sheets])
  useRevealActive()

  return (
    <>
      <div role="tree" aria-label="Pages" className="space-y-px">
        {(groups.get(null) ?? []).map((sheet) => (
          <SidebarTreeNode {...props} key={sheet.id} sheet={sheet} depth={0} groups={groups} />
        ))}
      </div>
      <TreeNotice />
    </>
  )
}
