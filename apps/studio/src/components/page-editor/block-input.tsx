import type { KeyboardEvent } from 'react'
import {
  type BlockInputProps,
  FIELD_CLASS,
  HEADING_LEVELS,
  KIND_LOOKS,
  KIND_PLACEHOLDERS,
  LIST_MARKERS,
  useBlockField,
  useEditorStore,
  useSlashMenu,
  withoutTrailingLines,
} from './lib'
import { SlashMenu } from './slash-menu'

export function BlockInput({ block, numberAt }: BlockInputProps) {
  const ref = useBlockField(block)
  const slash = useSlashMenu(block, ref)
  const store = useEditorStore.getState

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter and Backspace belong to the input method while it is composing (kana → kanji).
    if (event.nativeEvent.isComposing || slash.onKeyDown(event)) return
    const field = event.currentTarget
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0
    const atEnd = field.selectionStart === field.value.length
    if (event.key === 'Enter' && !event.shiftKey && block.kind !== 'code') {
      event.preventDefault()
      store().splitAt(block.id, field.selectionStart)
    } else if (event.key === 'Enter' && !event.shiftKey && atEnd && field.value.endsWith('\n')) {
      event.preventDefault()
      store().setText(block.id, withoutTrailingLines(field.value))
      store().insertAfter(block.id)
    } else if (event.key === 'Backspace' && atStart) {
      event.preventDefault()
      store().mergeBack(block.id)
    } else if (event.key === 'ArrowUp' && atStart) {
      event.preventDefault()
      store().moveFocus(block.id, -1)
    } else if (event.key === 'ArrowDown' && atEnd) {
      event.preventDefault()
      store().moveFocus(block.id, 1)
    } else if (event.key === 'Tab' && LIST_MARKERS[block.kind]) {
      // Lists here do not nest: Tab keeps the caret in the item rather than leaving the page.
      event.preventDefault()
    }
  }

  return (
    <div
      data-tone={block.kind === 'callout' ? String(block.props.tone ?? 'info') : undefined}
      className={`relative flex items-baseline gap-2 ${
        block.kind === 'quote' ? 'border-l-[3px] border-current/30 pl-4' : ''
      } ${
        block.kind === 'callout'
          ? 'rounded-xl border border-[var(--t-line)] bg-[var(--t-tint)] px-4 py-3'
          : ''
      } ${
        block.kind === 'code'
          ? 'rounded-xl border border-[var(--border)] bg-[var(--muted-bg)] px-4 py-3'
          : ''
      }`}
    >
      {block.kind === 'bullet' && <span className="select-none">•</span>}
      {block.kind === 'number' && <span className="select-none tabular-nums">{numberAt}.</span>}
      {block.kind === 'callout' && <span className="select-none">💡</span>}
      {block.kind === 'todo' && (
        <input
          type="checkbox"
          checked={block.done ?? false}
          onChange={(event) => store().setDone(block.id, event.target.checked)}
          aria-label={block.done ? 'Mark not done' : 'Mark done'}
          className="size-4 shrink-0 translate-y-0.5 accent-[var(--accent,currentColor)]"
        />
      )}
      <textarea
        ref={ref}
        rows={1}
        value={block.text}
        data-level={HEADING_LEVELS[block.kind]}
        placeholder={KIND_PLACEHOLDERS[block.kind] ?? "Type '/' for blocks"}
        aria-label={KIND_PLACEHOLDERS[block.kind] ?? 'Text'}
        onChange={(event) => {
          slash.onText(event.target.value)
          store().setText(block.id, event.target.value)
        }}
        onKeyDown={onKeyDown}
        className={`${FIELD_CLASS} ${KIND_LOOKS[block.kind] ?? 'wsx-text'} ${
          block.kind === 'todo' && block.done ? 'line-through opacity-50' : ''
        }`}
      />
      {slash.query !== null && <SlashMenu anchor={ref} menu={slash} />}
    </div>
  )
}
