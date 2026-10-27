import { useState } from 'react'
import type { CustomEmojiView, EmojiDraftState } from '../types'
import { toShortcode } from '../utils'

const EMPTY: EmojiDraftState = { name: '', file: null, busy: false, error: null }

/** A picture and a name on their way to being an emoji; the file's name is the first guess. */
export function useEmojiDraft(
  add: (name: string, file: File) => Promise<CustomEmojiView>,
  onAdded?: (emoji: CustomEmojiView) => void,
) {
  const [draft, setDraft] = useState<EmojiDraftState>(EMPTY)

  const setFile = (file: File | null) =>
    setDraft((current) => ({
      ...current,
      file,
      error: null,
      name: current.name || (file ? toShortcode(file.name) : ''),
    }))

  const setName = (name: string) => setDraft((current) => ({ ...current, name, error: null }))

  const submit = async () => {
    const name = toShortcode(draft.name.replace(/^:+|:+$/g, ''))
    if (!draft.file) return setDraft({ ...draft, error: 'Pick a picture first.' })
    if (name.length < 2)
      return setDraft({ ...draft, error: 'A name needs two characters or more.' })
    setDraft({ ...draft, name, busy: true, error: null })
    try {
      const emoji = await add(name, draft.file)
      setDraft(EMPTY)
      onAdded?.(emoji)
    } catch (cause) {
      setDraft((current) => ({
        ...current,
        busy: false,
        error: cause instanceof Error ? cause.message : 'That did not save.',
      }))
    }
  }

  return { ...draft, isReady: Boolean(draft.file && draft.name), setFile, setName, submit }
}
