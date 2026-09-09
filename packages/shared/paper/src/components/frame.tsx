import type { CSSProperties, ReactNode } from 'react'
import { styled } from '../lib'
import type { BlockProps, Feel, Gap, Tone } from '../lib/types'
import { THEMES, type ThemeId } from '../registry/themes'

const ALIGN: Record<string, string> = {
  start: 'flex-start',
  center: 'center',
  end: 'flex-end',
  baseline: 'baseline',
  stretch: 'stretch',
}

function themeVars(theme: ThemeId): CSSProperties {
  const pair = THEMES[theme]
  const out: Record<string, string> = {}
  for (const [mode, tokens] of [
    ['l', pair.light],
    ['d', pair.dark],
  ] as const) {
    out[`--wsx-${mode}-bg`] = tokens.bg
    out[`--wsx-${mode}-card`] = tokens.card
    out[`--wsx-${mode}-ink`] = tokens.ink
    out[`--wsx-${mode}-muted`] = tokens.muted
    out[`--wsx-${mode}-border`] = tokens.border
    out[`--wsx-${mode}-muted-bg`] = tokens.mutedBg
    out[`--wsx-${mode}-accent`] = tokens.accent
    out[`--wsx-${mode}-accent-ink`] = tokens.accentInk
  }
  return out as CSSProperties
}

/** The page: paper, ink, measure, padding and rhythm. Pages never set any of them. */
export function SheetFrame({
  theme = 'washi',
  feel = 'note',
  accent = 'accent',
  children,
}: {
  theme?: ThemeId
  feel?: Feel
  accent?: Tone
  children?: ReactNode
}) {
  return (
    <article
      className="wsx"
      data-feel={feel}
      data-theme={theme}
      data-accent={accent}
      style={themeVars(theme)}
    >
      <div className="wsx-page">{children}</div>
    </article>
  )
}

export function Section({
  title,
  gap,
  children,
  ...rest
}: BlockProps & { title?: string; gap?: Gap }) {
  return (
    <section {...styled(rest, 'wsx-section')} data-gap={gap}>
      {title && <h2 className="wsx-section-title">{title}</h2>}
      {children}
    </section>
  )
}

function flowStyle(rest: BlockProps, align: string | undefined): CSSProperties | undefined {
  const base = styled(rest).style ?? {}
  return align ? ({ ...base, '--align': ALIGN[align] } as CSSProperties) : (base as CSSProperties)
}

export function Row({ gap, align, children, ...rest }: BlockProps & { gap?: Gap; align?: string }) {
  return (
    <div {...styled(rest, 'wsx-row')} data-gap={gap} style={flowStyle(rest, align)}>
      {children}
    </div>
  )
}

export function Stack({
  gap,
  align,
  children,
  ...rest
}: BlockProps & { gap?: Gap; align?: string }) {
  return (
    <div {...styled(rest, 'wsx-stack')} data-gap={gap} style={flowStyle(rest, align)}>
      {children}
    </div>
  )
}

export function Grid({ gap, children, ...rest }: BlockProps & { gap?: Gap }) {
  return (
    <div {...styled(rest, 'wsx-grid')} data-gap={gap}>
      {children}
    </div>
  )
}

export function Divider(props: BlockProps) {
  return <hr {...styled(props, 'wsx-divider')} />
}
