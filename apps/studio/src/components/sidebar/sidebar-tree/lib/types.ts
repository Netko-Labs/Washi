import type { SheetSummary } from '@washi/domain'
import type { PageDrop } from '@washi/ui'

export interface TreeState {
  expanded: string[]
  draggingId: string | null
  over: { id: string; drop: PageDrop } | null
  /** Why the last move did not stick, shown under the tree until the next drag. */
  notice: string | null
  current: string | null
  setCurrent: (id: string) => void
  toggle: (id: string) => void
  expand: (ids: string[]) => void
  startDrag: (id: string) => void
  hover: (id: string, drop: PageDrop) => void
  clearHover: () => void
  endDrag: () => void
  report: (notice: string) => void
}

export interface SidebarTreeProps {
  workspaceId: string
  onNavigate: () => void
}

export interface TreeBranchProps extends SidebarTreeProps {
  tabStop: string | null
}

export interface SidebarTreeNodeProps extends TreeBranchProps {
  sheet: SheetSummary
  depth: number
  groups: Map<string | null, SheetSummary[]>
}

export interface SidebarTreeRowProps extends TreeBranchProps {
  sheet: SheetSummary
  depth: number
  hasChildren: boolean
  isExpanded: boolean
}

/** A row as drawn, in order: what the arrow keys walk. */
export interface TreeRow {
  id: string
  parentId: string | null
  hasChildren: boolean
  isExpanded: boolean
}

export type TreeMove = { kind: 'focus'; id: string } | { kind: 'toggle'; id: string }
