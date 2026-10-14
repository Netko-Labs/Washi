import type { MentionRef } from '@washi/domain'
import { useRef, useState } from 'react'
import { type CommentComposerProps, keptMentions, mentionQuery, useCommentsStore } from './lib'
import { MentionPicker } from './mention-picker'

/** Enter sends, Shift+Enter breaks the line, `@` names someone and puts it in their Inbox. */
export function CommentComposer({ sheetId, threadId, placeholder, onSent }: CommentComposerProps) {
  const [draft, setDraft] = useState({ text: '', caret: 0 })
  const [picked, setPicked] = useState<MentionRef[]>([])
  const field = useRef<HTMLTextAreaElement>(null)
  const query = mentionQuery(draft.text, draft.caret)

  const send = async () => {
    const body = draft.text.trim()
    if (!body) return
    const mentions = keptMentions(body, picked)
    const sent = await useCommentsStore.getState().post({ sheetId, threadId, body, mentions })
    if (!sent) return
    setDraft({ text: '', caret: 0 })
    setPicked([])
    onSent?.()
  }

  const pick = (member: MentionRef) => {
    const before = draft.text.slice(0, draft.caret).replace(/@[^\s@]*$/, `@${member.name} `)
    const text = before + draft.text.slice(draft.caret)
    setDraft({ text, caret: before.length })
    setPicked((current) => [...current.filter((each) => each.id !== member.id), member])
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
          setDraft({ text: event.target.value, caret: event.target.selectionStart })
        }
        onSelect={(event) => {
          const caret = event.currentTarget.selectionStart
          setDraft((current) => (current.caret === caret ? current : { ...current, caret }))
        }}
        onKeyDown={(event) => {
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
