import { acceptFor } from '@washi/domain'
import { useNoticeStore } from '@washi/ui'
import type { KeyboardEvent } from 'react'
import { useRef } from 'react'
import { useUnsplashPickStore } from '@/components/shared/unsplash'
import {
  type BlockInputProps,
  FIELD_CLASS,
  HEADING_LEVELS,
  isNestedBlock,
  KIND_LOOKS,
  KIND_PLACEHOLDERS,
  pickFiles,
  type SlashOption,
  slashMatches,
  useAutoSize,
  useEditorStore,
  useFocusRequest,
} from './lib'
import { SlashMenu } from './slash-menu'

export function BlockInput({ block, numberAt }: BlockInputProps) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useFocusRequest(block.id, ref)
  useAutoSize(ref, block.text)
  const slash = block.text.startsWith('/') ? block.text.slice(1) : null
  const store = useEditorStore.getState

  const pick = (option: SlashOption) => {
    if (option.type === 'data') {
      const { pick: chosen } = option
      // An upload's picker opens inside this press; the block lands once the file is stored.
      const ready =
        chosen.kind === 'upload'
          ? pickFiles(acceptFor(chosen.as)).then(([file]) => (file ? { ...chosen, file } : null))
          : chosen.kind === 'gallery'
            ? pickFiles(acceptFor('image'), true).then((files) =>
                files.length > 0 ? { ...chosen, files } : null,
              )
            : chosen.kind === 'unsplash' && ref.current
              ? useUnsplashPickStore
                  .getState()
                  .ask(ref.current)
                  .then((photo) => (photo ? { ...chosen, photo } : null))
              : Promise.resolve(chosen)
      // The `/` text stays put, so a refused name (taken since the menu loaded) can be retyped.
      ready
        .then((landing) => landing && store().insertData(block.id, landing))
        .catch((cause: unknown) =>
          useNoticeStore
            .getState()
            .say(`That did not land — ${cause instanceof Error ? cause.message : String(cause)}`),
        )
      return
    }
    store().turnInto(block.id, option.kind)
    store().setText(block.id, '')
  }

  const onKeyDown = (event: KeyboardEvent<HTMLTextAreaElement>) => {
    // Enter and Backspace belong to the input method while it is composing (kana → kanji).
    if (event.nativeEvent.isComposing) return
    const field = event.currentTarget
    const atStart = field.selectionStart === 0 && field.selectionEnd === 0
    const atEnd = field.selectionStart === field.value.length
    if (event.key === 'Enter' && !event.shiftKey && block.kind !== 'code') {
      event.preventDefault()
      const isNested = isNestedBlock(store().blocks, block.id)
      const [first] = slash === null ? [] : slashMatches(slash, store().tables, [], isNested)
      if (first) pick(first)
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
        data-level={HEADING_LEVELS[block.kind]}
        placeholder={KIND_PLACEHOLDERS[block.kind] ?? "Type '/' for blocks"}
        aria-label={KIND_PLACEHOLDERS[block.kind] ?? 'Text'}
        onChange={(event) => store().setText(block.id, event.target.value)}
        onKeyDown={onKeyDown}
        className={`${FIELD_CLASS} ${KIND_LOOKS[block.kind] ?? 'wsx-text'} ${
          block.kind === 'todo' && block.done ? 'line-through opacity-50' : ''
        }`}
      />
      {slash !== null && <SlashMenu id={block.id} query={slash} onPick={pick} />}
    </div>
  )
}
