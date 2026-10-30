export interface ConfirmDeleteButtonProps {
  /** What is being deleted, for the accessible name: "Delete Trip to Kyoto". */
  label: string
  onConfirm: () => void
  className?: string
  tabIndex?: number
}
