import type { KeyboardEvent } from 'react'
import { useRef } from 'react'
import {
  type BlockInputProps,
  kindMatches,
  type TextKind,
  useAutoSize,
  useEditorStore,
  useFocusRequest,
} from './lib'
import { SlashMenu } from './slash-menu'

const FIELD =
  'block w-full resize-none overflow-hidden border-0 bg-transparent p-0 outline-none placeholder:text-muted-foreground/50 placeholder:opacity-0 focus:placeholder:opacity-100'

const LOOK: Partial<Record<TextKind, string>> = {
  h1: 'wsx-title',
  h2: 'wsx-title',
  h3: 'wsx-title',
  code: 'font-mono text-[13px]',
}

const PLACEHOLDER: Partial<Record<TextKind, string>> = {
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  bullet: 'List',
  number: 'List',
  todo: 'To-do',
  quote: 'Quote',
  callout: 'Something to notice',
  code: 'Code',
}

const LEVEL: Partial<Record<TextKind, number>> = { h1: 1, h2: 2, h3: 3 }

export function BlockInput({ block, numberAt }: BlockInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useFocusRequest(block.id, ref)
  useAutoSize(ref, block.text)
  const slash = block.text.startsWith('/') ? block.text.slice(1) : null
  const store = useEditorStore.getState

  const pick = (kind: TextKind) => {
    store().turnInto(block.id, kind)
    store().setText(block.id, '')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    const field = event.currentTarget
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0
    const atEnd = field.selectionStart === field.value.length
    if (event.key === 'Enter' && !event.shiftKey && block.kind !== 'code') {
      event.preventDefault()
      const [first] = slash === null ? [] : kindMatches(slash)
      if (first) pick(first.kind)
      else store().splitAt(block.id, field.selectionStart)
    } else if (event.key === 'Escape' && slash !== null) {
      store().setText(block.id, '')
    } else if (event.key === 'Backspace' && atStart) {
      event.preventDefault()
      store().mergeBack(block.id)
    } else if (event.key === 'ArrowUp' && atStart) {
      event.preventDefault()
      store().moveFocus(block.id, -1)
    } else if (event.key === 'ArrowDown' && atEnd) {
      event.preventDefault()
      store().moveFocus(block.id, 1)
    }
  }

  return (
    <div
      className={`relative flex items-baseline gap-2 ${
        block.kind === 'quote' ? 'border-l-[3px] border-current/30 pl-4' : ''
      } ${block.kind === 'callout' ? 'rounded-xl bg-black/[0.04] px-4 py-3' : ''} ${
        block.kind === 'code' ? 'rounded-xl bg-black/[0.05] px-4 py-3' : ''
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
        data-level={LEVEL[block.kind]}
        placeholder={PLACEHOLDER[block.kind] ?? "Type '/' for blocks"}
        aria-label={PLACEHOLDER[block.kind] ?? 'Text'}
        onChange={(event) => store().setText(block.id, event.target.value)}
        onKeyDown={onKeyDown}
        className={`${FIELD} ${LOOK[block.kind] ?? 'wsx-text'} ${
          block.kind === 'todo' && block.done ? 'line-through opacity-50' : ''
        }`}
      />
      {slash !== null && <SlashMenu query={slash} onPick={pick} />}
    </div>
  )
}
