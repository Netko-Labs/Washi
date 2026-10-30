import { focusMain, MAIN_ID, useMainOnNavigate } from './lib'

/** The shell's first stop, seen only when focused; it also owns where focus lands after navigating. */
export function SkipLink() {
  useMainOnNavigate()

  return (
    <a
      href={`#${MAIN_ID}`}
      onClick={(event) => {
        event.preventDefault()
        focusMain()
      }}
      className="sr-only rounded-lg bg-popover px-3 py-2 font-medium text-[13px] text-popover-foreground shadow-[0_8px_24px_rgb(0_0_0/0.18)] focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100]"
    >
      Skip to content
    </a>
  )
}
