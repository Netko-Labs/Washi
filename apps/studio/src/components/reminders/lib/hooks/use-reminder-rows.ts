import type { ReminderHit } from '@washi/domain'
import { type InboxRow, useViewStore } from '@washi/ui'
import { useEffect, useMemo } from 'react'
import { api } from '@/integrations/trpc'
import { useRemindersStore } from '../reminders-store'
import { rowOf } from '../utils'

async function open(hit: ReminderHit): Promise<void> {
  void useRemindersStore.getState().markRead([hit.id])
  const { sheetId } = await api.tables.openRow.mutate({ recordId: hit.recordId })
  useViewStore.getState().openTab(`note:${sheetId}`)
}

/** Rows coming due, shaped for the Inbox list; opening one lands on the row's page. */
export function useReminderRows(): InboxRow[] {
  const items = useRemindersStore((state) => state.items)
  useEffect(() => {
    void useRemindersStore.getState().refresh()
  }, [])
  return useMemo(
    () => items.map((hit) => rowOf(hit, (each) => void open(each).catch(() => {}))),
    [items],
  )
}
