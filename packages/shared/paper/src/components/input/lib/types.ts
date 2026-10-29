export interface FieldBinding {
  id: string
  value: string
  setValue: (value: string) => void
  error: string | null
  commit: (next: string | number | boolean) => Promise<void>
}
