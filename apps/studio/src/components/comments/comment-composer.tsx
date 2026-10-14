import type { MentionRef } from '@washi/domain'
import { useRef, useState } from 'react'
import { type CommentComposerProps, keptMentions, mentionQuery, useCommentsStore } from './lib'
import { MentionPicker } from './mention-picker'

const EMPTY = { text: '', caret: 0, picked: [] as MentionRef[] }

/** Enter sends, Shift+Enter breaks the line, `@` names someone and puts it in their Inbox. */
export function CommentComposer({ sheetId, threadId, placeholder, onSent }: CommentComposerProps) {
  const [draft, setDraft] = useState(EMPTY)
  const field = useRef<HTMLTextAreaElement>(null)
  const isSending = useRef(false)
  const query = mentionQuery(draft.text, draft.caret)

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
    requestAnimationFrame(() => field.current?.setSelectionRange(before.length, before.length))
  }

  return (
    <div className="relative">
      {query !== null && <MentionPicker query={query} onPick={pick} />}
      <textarea
        ref={field}
        rows={2}
        value={draft.text}
        placeholder={placeholder}
        aria-label={placeholder}
        onChange={(event) =>
          setDraft({ ...draft, text: event.target.value, caret: event.target.selectionStart })
        }
        onSelect={(event) => {
          const caret = event.currentTarget.selectionStart
          setDraft((current) => (current.caret === caret ? current : { ...current, caret }))
        }}
        onKeyDown={(event) => {
          // Enter confirms the input method's conversion (kana → kanji) while it is composing.
          if (event.nativeEvent.isComposing) return
          if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault()
            void send()
          }
        }}
        className="block w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[13px] leading-relaxed outline-none focus-visible:border-primary"
      />
    </div>
  )
}
