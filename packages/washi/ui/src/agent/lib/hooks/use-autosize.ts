import { type RefObject, useLayoutEffect } from 'react'
import { composerCap } from '../utils'

/** Fits the box to its text up to a share of the agent panel (else the viewport), then scrolls. */
export function useAutosize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    const room =
      box.closest('[data-agent-panel]')?.clientHeight ?? document.documentElement.clientHeight
    const cap = composerCap(room)
    box.style.height = 'auto'
    box.style.height = `${Math.min(box.scrollHeight, cap)}px`
    box.style.overflowY = box.scrollHeight > cap ? 'auto' : 'hidden'
  }, [value, ref])
}
