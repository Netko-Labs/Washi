import { type CommentComposerProps, useComposer } from './lib'
import { MentionPicker } from './mention-picker'

/** Enter sends, Shift+Enter breaks the line, `@` names someone and puts it in their Inbox. */
export function CommentComposer(props: CommentComposerProps) {
  const { draft, field, matches, active, pick, edit, moveCaret, onKeyDown } = useComposer(props)

  return (
    <div className="relative">
      {matches.length > 0 && <MentionPicker matches={matches} active={active} onPick={pick} />}
      <textarea
        ref={field}
        rows={2}
        value={draft.text}
        placeholder={props.placeholder}
        aria-label={props.placeholder}
        onChange={(event) => edit(event.target.value, event.target.selectionStart)}
        onSelect={(event) => moveCaret(event.currentTarget.selectionStart)}
        onKeyDown={onKeyDown}
        className="block w-full resize-none rounded-xl border border-border bg-background px-3 py-2 text-[13px] leading-relaxed outline-none focus-visible:border-primary"
      />
    </div>
  )
}
