import type { CSSProperties } from 'react'
import { styled } from '../lib'
import type { BentoProps, ColumnProps, ColumnsProps, TileProps } from '../lib/types'

/** Side by side, each column its `ratio` share; they stack when the sheet is narrow. */
export function Columns({ gap, children, ...rest }: ColumnsProps) {
  return (
    <div {...styled(rest, 'wsx-cols')} data-gap={gap}>
      {children}
    </div>
  )
}

export function Column({ ratio, children, ...rest }: ColumnProps) {
  const base = styled(rest, 'wsx-col')
  return (
    <div {...base} style={{ ...base.style, '--ratio': ratio ?? 1 } as CSSProperties}>
      {children}
    </div>
  )
}

/** Tiles packed densely; a tile's shape says how many cells it takes, never a pixel size. */
export function Bento({ gap, columns, children, ...rest }: BentoProps) {
  return (
    <div {...styled(rest, 'wsx-bento')} data-gap={gap} data-columns={columns ?? 4}>
      {children}
    </div>
  )
}

export function Tile({ shape, title, children, ...rest }: TileProps) {
  return (
    <section {...styled(rest, 'wsx-card wsx-tile')} data-shape={shape ?? 'square'}>
      {title && <h3 className="wsx-tile-title">{title}</h3>}
      <div className="wsx-tile-body">{children}</div>
    </section>
  )
}
