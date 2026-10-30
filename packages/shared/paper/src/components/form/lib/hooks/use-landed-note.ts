import { useRef, useState } from 'react'
import { LANDED_NOTE_MS } from '../constants'
import type { LandedNote } from '../types'

/** A quiet line said after a write lands, gone after a few seconds or at the next press. */
export function useLandedNote(): LandedNote {
  const [note, setNote] = useState<string | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  const clear = () => {
    if (timer.current) clearTimeout(timer.current)
    setNote(null)
  }
  const show = (words: string) => {
    clear()
    setNote(words)
    timer.current = setTimeout(() => setNote(null), LANDED_NOTE_MS)
  }

  return { note, show, clear }
}
