export type CreateResult = { id: string } | { error: string }

export interface WorkspacePickerProps {
  onOpen: (id: string) => void
}
