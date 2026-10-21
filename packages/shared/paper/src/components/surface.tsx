import type { CSSProperties } from 'react'
import { styled } from '../lib'
import type { BlockProps, Tone } from '../lib/types'

const CALLOUT_ICONS: Record<Tone, string> = {
  neutral: 'M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  accent: 'M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z',
  info: 'M12 8h.01M11 12h1v4h1M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
  success: 'M5 12l5 5L20 7',
  warning:
    'M12 9v4m0 4h.01M10.3 3.9L2.5 17.4A2 2 0 0 0 4.2 20.5h15.6a2 2 0 0 0 1.7-3.1L13.7 3.9a2 2 0 0 0-3.4 0z',
  danger: 'M12 8v5m0 3h.01M12 3a9 9 0 1 0 0 18 9 9 0 0 0 0-18z',
}

const RATIOS: Record<string, string> = {
  '16:9': '16 / 9',
  '4:3': '4 / 3',
  '3:2': '3 / 2',
  '1:1': '1 / 1',
}

export function Card({ title, children, ...rest }: BlockProps & { title?: string }) {
  return (
    <div {...styled(rest, 'wsx-card')}>
      {rest.variant === 'tape' && (
        <span className="wsx-card-tape" data-tone={rest.tone ?? 'accent'}>
          {title ?? 'note'}
        </span>
      )}
      {title && rest.variant !== 'tape' && <div className="wsx-card-title">{title}</div>}
      <div className="wsx-card-body">{children}</div>
    </div>
  )
}

/** Tone is never the only signal — every callout carries an icon beside its text. */
export function Callout({ title, children, ...rest }: BlockProps & { title?: string }) {
  const tone = rest.tone ?? 'info'
  return (
    <aside
      {...styled({ ...rest, tone }, 'wsx-callout')}
      role={tone === 'danger' || tone === 'warning' ? 'alert' : 'note'}
    >
      <svg
        className="wsx-callout-icon"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden
      >
        <path d={CALLOUT_ICONS[tone]} />
      </svg>
      <div className="wsx-callout-content">
        {title && <div className="wsx-callout-title">{title}</div>}
        <div className="wsx-callout-body">{children}</div>
      </div>
    </aside>
  )
}

export function Hero({
  title,
  subtitle,
  align = 'left',
  ...rest
}: BlockProps & { title: string; subtitle?: string; align?: 'left' | 'center' }) {
  return (
    <header {...styled({ size: 'lg', ...rest }, 'wsx-hero')} data-align={align}>
      <h1 className="wsx-hero-title">{title}</h1>
      {subtitle && <p className="wsx-hero-subtitle">{subtitle}</p>}
    </header>
  )
}

export function Figure({
  src,
  alt,
  caption,
  ratio,
  ...rest
}: BlockProps & { src: string; alt: string; caption?: string; ratio?: string }) {
  const style = ratio ? ({ '--ratio': RATIOS[ratio] } as CSSProperties) : undefined
  return (
    <figure {...styled(rest, 'wsx-figure')}>
      <div className="wsx-figure-frame" style={style}>
        <img src={src} alt={alt} loading="lazy" />
      </div>
      {caption && <figcaption>{caption}</figcaption>}
    </figure>
  )
}
