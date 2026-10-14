import type { SheetSummary } from '@washi/domain'
import type { PageDrop } from '@washi/ui'

export interface TreeState {
  expanded: string[]
  draggingId: string | null
  over: { id: string; drop: PageDrop } | null
  toggle: (id: string) => void
  expand: (ids: string[]) => void
  startDrag: (id: string) => void
  hover: (id: string, drop: PageDrop) => void
  endDrag: () => void
}

export interface SidebarTreeProps {
  workspaceId: string
  onNavigate: () => void
}

export interface SidebarTreeNodeProps extends SidebarTreeProps {
  sheet: SheetSummary
  depth: number
  groups: Map<string | null, SheetSummary[]>
}

export interface SidebarTreeRowProps extends SidebarTreeProps {
  sheet: SheetSummary
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}
