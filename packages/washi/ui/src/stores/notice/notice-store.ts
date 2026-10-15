import { create } from 'zustand'

interface NoticeState {
  message: string | null
  say: (message: string) => void
  dismiss: () => void
}

let timer: ReturnType<typeof setTimeout> | null = null

/** One line the app says out loud when something a person did could not happen. */
export const useNoticeStore = create<NoticeState>((set) => ({
  message: null,
  say: (message) => {
    if (timer) clearTimeout(timer)
    set({ message })
    timer = setTimeout(() => set({ message: null }), 5000)
  },
  dismiss: () => set({ message: null }),
}))
