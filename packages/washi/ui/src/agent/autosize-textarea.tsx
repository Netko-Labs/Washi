import { useRef } from 'react'
import { type AutosizeTextareaProps, useAutosize } from './lib'

/** Grows with what is typed, then scrolls; Enter sends, Shift+Enter breaks a line. */
export function AutosizeTextarea({
  value,
  onChange,
  onSubmit,
  placeholder,
  className,
  inputRef,
}: AutosizeTextareaProps) {
  const own = useRef<HTMLTextAreaElement>(null)
  const ref = inputRef ?? own
  useAutosize(ref, value)

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
      className={`block w-full resize-none bg-transparent outline-none placeholder:text-muted-foreground ${className}`}
    />
  )
}
