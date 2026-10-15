export interface NoticeState {
  message: string | null
  say: (message: string) => void
  dismiss: () => void
}
