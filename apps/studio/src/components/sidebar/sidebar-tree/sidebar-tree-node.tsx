import { type SidebarTreeNodeProps, useTreeStore } from './lib'
import { SidebarTreeRow } from './sidebar-tree-row'

export function SidebarTreeNode({ sheet, depth, groups, ...rest }: SidebarTreeNodeProps) {
  const isExpanded = useTreeStore((state) => state.expanded.includes(sheet.id))
  const children = groups.get(sheet.id) ?? []

  return (
    <>
      <SidebarTreeRow
        {...rest}
        sheet={sheet}
        depth={depth}
        hasChildren={children.length > 0}
        isExpanded={isExpanded}
      />
      {isExpanded && children.length > 0 && (
        <div role="group" className="space-y-px">
          {children.map((child) => (
            <SidebarTreeNode
              {...rest}
              key={child.id}
              sheet={child}
              depth={depth + 1}
              groups={groups}
            />
          ))}
        </div>
      )}
    </>
  )
}
