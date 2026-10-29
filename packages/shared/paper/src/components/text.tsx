import { createContext, useContext, useEffect, useState } from 'react'
import { styled, useExprValue } from '../lib'
import type {
  BlockProps,
  CodeProps,
  ItemProps,
  ListProps,
  Marker,
  MoneyProps,
  NoteProps,
  PairProps,
  RefProps,
  SourceProps,
  TextProps,
  TitleProps,
} from '../lib/types'
import { usePaperHost } from '../provider'

export function Title({ level = 1, children, ...rest }: TitleProps) {
  const Tag = level === 1 ? 'h1' : level === 2 ? 'h2' : 'h3'
  return (
    <Tag {...styled(rest, 'wsx-title')} data-level={level}>
      {children}
    </Tag>
  )
}

export function Text({ lead, children, ...rest }: TextProps) {
  return (
    <p {...styled(rest, 'wsx-text')} data-lead={lead || undefined}>
      {children}
    </p>
  )
}

const MarkerContext = createContext<Marker>('bullet')

export function List({ marker = 'bullet', children, ...rest }: ListProps) {
  const Tag = marker === 'number' ? 'ol' : 'ul'
  return (
    <MarkerContext.Provider value={marker}>
      <Tag {...styled(rest, 'wsx-list')} data-marker={marker}>
        {children}
      </Tag>
    </MarkerContext.Provider>
  )
}

export function Item({ done, children, ...rest }: ItemProps) {
  const marker = useContext(MarkerContext)
  return (
    <li {...styled(rest, 'wsx-item')} data-done={done || undefined}>
      {marker === 'check' && <span className="wsx-item-check">{done ? '✓' : ''}</span>}
      <span>{children}</span>
    </li>
  )
}

export function Quote({ children, ...rest }: BlockProps) {
  return <blockquote {...styled(rest, 'wsx-quote')}>{children}</blockquote>
}

export function Code({ lang, children, ...rest }: CodeProps) {
  return (
    <pre {...styled(rest, 'wsx-code')}>
      {lang && <span className="wsx-code-lang">{lang}</span>}
      <code>{children}</code>
    </pre>
  )
}

export function Pair({ term, children, ...rest }: PairProps) {
  return (
    <dl {...styled(rest, 'wsx-pair')}>
      <dt>{term}</dt>
      <dd>{children}</dd>
    </dl>
  )
}

export function Note({ number, children, ...rest }: NoteProps) {
  return (
    <aside {...styled(rest, 'wsx-note')}>
      <span className="wsx-note-n">{number}</span>
      <span>{children}</span>
    </aside>
  )
}

export function Source({ number, children, ...rest }: SourceProps) {
  return (
    <cite {...styled(rest, 'wsx-source')}>
      <span className="wsx-source-n">§{number}</span>
      <span>{children}</span>
    </cite>
  )
}

export function Money({ value, expr, currency, ...rest }: MoneyProps) {
  const host = usePaperHost()
  const computed = useExprValue(expr)
  const amount = typeof computed === 'number' ? computed : (value ?? 0)
  const text = new Intl.NumberFormat(host.locale, { style: 'currency', currency }).format(amount)
  return (
    <span {...styled(rest, 'wsx-money')} data-negative={amount < 0 || undefined}>
      {text}
    </span>
  )
}

export function Mark({ children, ...rest }: BlockProps) {
  return <mark {...styled(rest, 'wsx-mark')}>{children}</mark>
}

export function Kbd({ children, ...rest }: BlockProps) {
  return <kbd {...styled(rest, 'wsx-kbd')}>{children}</kbd>
}

export function Tag({ children, ...rest }: BlockProps) {
  return <span {...styled(rest, 'wsx-tag')}>{children}</span>
}

export function Ref({ sheet, children, ...rest }: RefProps) {
  const host = usePaperHost()
  const [title, setTitle] = useState<string | null>(null)

  useEffect(() => {
    let alive = true
    host.resolveSheet(sheet).then((resolved) => alive && resolved && setTitle(resolved.title))
    return () => {
      alive = false
    }
  }, [host, sheet])

  return (
    <button type="button" {...styled(rest, 'wsx-ref')} onClick={() => host.openSheet(sheet)}>
      {children !== undefined && (!Array.isArray(children) || children.length > 0)
        ? children
        : (title ?? sheet)}
    </button>
  )
}
