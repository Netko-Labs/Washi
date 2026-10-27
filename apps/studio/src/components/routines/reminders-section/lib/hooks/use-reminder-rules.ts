import { useCallback, useEffect, useState } from 'react'
import { api } from '@/integrations/trpc'
import type { ReminderInput, ReminderWire, TableWire } from '../types'

const messageOf = (cause: unknown) => (cause instanceof Error ? cause.message : String(cause))

/** The workspace's reminder rules and the tables they may read; every change rereads. */
export function useReminderRules() {
  const [reminders, setReminders] = useState<ReminderWire[] | null>(null)
  const [tables, setTables] = useState<TableWire[]>([])
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    try {
      const [rules, all] = await Promise.all([api.reminders.list.query(), api.tables.list.query()])
      setReminders(rules)
      setTables(all)
    } catch (cause) {
      setError(messageOf(cause))
    }
  }, [])

  useEffect(() => {
    void refresh()
  }, [refresh])

  const change = async (write: () => Promise<unknown>): Promise<boolean> => {
    setError(null)
    const isDone = await write()
      .then(() => true)
      .catch((cause: unknown) => {
        setError(messageOf(cause))
        return false
      })
    await refresh()
    return isDone
  }

  return {
    reminders,
    tables,
    error,
    create: (input: ReminderInput) => change(() => api.reminders.create.mutate(input)),
    toggle: (id: string, enabled: boolean) =>
      change(() => api.reminders.update.mutate({ id, enabled })),
    remove: (id: string) => change(() => api.reminders.remove.mutate({ id })),
  }
}
