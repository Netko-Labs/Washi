import type { MentionItem } from '@washi/domain'
import { editedAt, type InboxRow } from '@washi/ui'

/** A mention as an Inbox row: who · mentioned you in · where, the comment under it. */
export function rowOf(item: MentionItem, open: (item: MentionItem) => void): InboxRow {
  return {
    id: item.commentId,
    kind: 'mention',
    at: editedAt(item.hlcCreated),
    who: item.authorName,
    verb: 'mentioned you in',
    where: item.sheetTitle,
    detail: item.body,
    unread: !item.isRead,
    onOpen: () => open(item),
  }
}
