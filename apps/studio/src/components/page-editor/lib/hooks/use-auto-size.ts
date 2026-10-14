import { type RefObject, useLayoutEffect } from 'react'

/** A block is as tall as its text; a textarea is not, on its own. */
export function useAutoSize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return
    field.style.height = 'auto'
    field.style.height = `${field.scrollHeight}px`
  }, [ref, value])
}
