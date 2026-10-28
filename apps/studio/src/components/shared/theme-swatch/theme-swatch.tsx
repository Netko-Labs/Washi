import type { CSSProperties } from 'react'
import type { ThemeSwatchProps } from './lib'

/** A theme at a glance, in the reader's mode: its paper, its ink as "Aa", its accent. */
export function ThemeSwatch({ pair, className = '' }: ThemeSwatchProps) {
  const style = {
    '--sw-l-bg': pair.light.card,
    '--sw-l-ink': pair.light.ink,
    '--sw-l-accent': pair.light.accent,
    '--sw-l-border': pair.light.border,
    '--sw-d-bg': pair.dark.card,
    '--sw-d-ink': pair.dark.ink,
    '--sw-d-accent': pair.dark.accent,
    '--sw-d-border': pair.dark.border,
  } as CSSProperties
  return (
    <span
      aria-hidden
      style={style}
      className={`relative inline-grid shrink-0 place-items-center rounded-md border border-(--sw-l-border) bg-(--sw-l-bg) font-semibold text-(--sw-l-ink) dark:border-(--sw-d-border) dark:bg-(--sw-d-bg) dark:text-(--sw-d-ink) ${className}`}
    >
      Aa
      <span className="absolute right-0.5 bottom-0.5 size-1.5 rounded-full bg-(--sw-l-accent) dark:bg-(--sw-d-accent)" />
    </span>
  )
}
