import type { MentionItem } from '@washi/domain'
import { type InboxRow, useViewStore } from '@washi/ui'
import { useEffect, useMemo } from 'react'
import { useCommentsStore } from '@/components/comments'
import { useMentionsStore } from '../mentions-store'
import { rowOf } from '../utils'

function open(item: MentionItem): void {
  useViewStore.getState().openTab(`note:${item.sheetId}`)
  useCommentsStore.getState().open(item.sheetId)
  void useMentionsStore.getState().markRead({ commentIds: [item.commentId] })
}

/** The people who asked for you, shaped for the Inbox list; opening one lands on the page with its comments. */
export function useMentionRows(): InboxRow[] {
  const items = useMentionsStore((state) => state.items)
  useEffect(() => {
    void useMentionsStore.getState().refresh()
  }, [])
  return useMemo(() => items.map((item) => rowOf(item, open)), [items])
}
