export type RowOpener = (sheetId: string) => void

export interface RowOpenerState {
  opener: RowOpener | null
  register: (opener: RowOpener) => () => void
}
