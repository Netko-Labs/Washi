import { useEffect } from 'react'
import { REMINDERS_POLL_MS } from '../constants'
import { useRemindersStore } from '../reminders-store'

export function useRemindersPoll(workspaceId: string) {
  useEffect(() => {
    const check = () =>
      void useRemindersStore
        .getState()
        .refreshCount()
        .catch(() => {})
    check()
    const timer = setInterval(check, REMINDERS_POLL_MS)
    return () => clearInterval(timer)
  }, [workspaceId])
}
