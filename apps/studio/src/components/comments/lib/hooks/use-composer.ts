import type { MentionRef } from '@washi/domain'
import { useRef, useState } from 'react'
import { useCommentsStore } from '../comments-store'
import type { CommentComposerProps, CommentDraft, Composer } from '../types'
import { keptMentions, mentionMatches, mentionQuery } from '../utils'

const EMPTY: CommentDraft = { text: '', caret: 0, picked: [] }

/** A draft and its `@` picker: while the picker is open, Enter and Tab pick, arrows move, Escape closes. */
export function useComposer({ sheetId, threadId, onSent }: CommentComposerProps): Composer {
  const [draft, setDraft] = useState(EMPTY)
  const [picker, setPicker] = useState({ active: 0, dismissed: false })
  const field = useRef<HTMLTextAreaElement>(null)
  const isSending = useRef(false)
  const members = useCommentsStore((state) => state.members)

  const query = picker.dismissed ? null : mentionQuery(draft.text, draft.caret)
  const matches = query === null ? [] : mentionMatches(members, query)
  const active = Math.min(picker.active, Math.max(0, matches.length - 1))

  const send = async () => {
    const body = draft.text.trim()
    if (!body || isSending.current) return
    isSending.current = true
    const sending = draft
    setDraft(EMPTY)
    const mentions = keptMentions(body, sending.picked)
    const sent = await useCommentsStore.getState().post({ sheetId, threadId, body, mentions })
    isSending.current = false
    if (!sent) return setDraft(sending)
    onSent?.()
  }

  const pick = (member: MentionRef) => {
    const before = draft.text.slice(0, draft.caret).replace(/@[^\s@]*$/, `@${member.name} `)
    setDraft({
      text: before + draft.text.slice(draft.caret),
      caret: before.length,
      picked: [...draft.picked.filter((each) => each.id !== member.id), member],
    })
    // Closed until the next keystroke: React's onSelect can still report the pre-pick caret.
    setPicker({ active: 0, dismissed: true })
    requestAnimationFrame(() => field.current?.setSelectionRange(before.length, before.length))
  }

  const onKeyDown: Composer['onKeyDown'] = (event) => {
    // Enter confirms the input method's conversion (kana → kanji) while it is composing.
    if (event.nativeEvent.isComposing) return
    const member = matches[active]
    if (member) {
      const step = { ArrowDown: 1, ArrowUp: -1 }[event.key]
      if (step) {
        event.preventDefault()
        setPicker({ active: (active + step + matches.length) % matches.length, dismissed: false })
        return
      }
      if ((event.key === 'Enter' && !event.shiftKey) || event.key === 'Tab') {
        event.preventDefault()
        return pick(member)
      }
      if (event.key === 'Escape') {
        event.preventDefault()
        event.stopPropagation()
        return setPicker({ active: 0, dismissed: true })
      }
    }
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault()
      void send()
    }
  }

  return {
    draft,
    field,
    matches,
    active,
    pick,
    edit: (text, caret) => {
      setDraft({ ...draft, text, caret })
      setPicker({ active: 0, dismissed: false })
    },
    moveCaret: (caret) =>
      setDraft((current) => (current.caret === caret ? current : { ...current, caret })),
    onKeyDown,
  }
}
