import { useLayoutEffect, useRef } from 'react'
import { type AutosizeTextareaProps, COMPOSER_MAX_PX } from './lib'

/** Grows with what is typed up to a cap, then scrolls; Enter sends, Shift+Enter breaks a line. */
export function AutosizeTextarea({
  value,
  onChange,
  onSubmit,
  placeholder,
  inputRef,
}: AutosizeTextareaProps) {
  const own = useRef<HTMLTextAreaElement>(null)
  const ref = inputRef ?? own

  useLayoutEffect(() => {
    const box = ref.current
    if (!box) return
    box.style.height = 'auto'
    box.style.height = `${Math.min(box.scrollHeight, COMPOSER_MAX_PX)}px`
  }, [value, ref])

  return (
    <textarea
      ref={ref}
      value={value}
      rows={1}
      onChange={(event) => onChange(event.target.value)}
      onKeyDown={(event) => {
        if (event.key === 'Enter' && !event.shiftKey && !event.nativeEvent.isComposing) {
          event.preventDefault()
          onSubmit()
        }
      }}
      placeholder={placeholder}
      aria-label="Message Washi"
      className="block max-h-60 min-h-7 w-full resize-none bg-transparent text-[16px] leading-7 outline-none placeholder:text-muted-foreground md:text-[15px]"
    />
  )
}
