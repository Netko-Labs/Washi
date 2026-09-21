export interface WorkspaceSummary {
  id: string
  name: string
  role: string
}

export interface SheetListItem {
  id: string
  title: string
  icon: string | null
  tags: string[]
  hlcUpdated: string
}
