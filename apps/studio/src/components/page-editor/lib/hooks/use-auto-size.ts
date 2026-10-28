import { type RefObject, useLayoutEffect } from 'react'

function fit(field: HTMLTextAreaElement) {
  field.style.height = 'auto'
  field.style.height = `${field.scrollHeight}px`
}

/** A block is as tall as its text at its width — a column resized narrower wraps it taller. */
export function useAutoSize(ref: RefObject<HTMLTextAreaElement | null>, value: string) {
  useLayoutEffect(() => {
    const field = ref.current
    if (!field) return
    fit(field)
    let width = field.clientWidth
    const watch = new ResizeObserver(() => {
      if (field.clientWidth === width) return
      width = field.clientWidth
      fit(field)
    })
    watch.observe(field)
    return () => watch.disconnect()
  }, [ref, value])
}
