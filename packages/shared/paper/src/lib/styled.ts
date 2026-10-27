import type { StyledProps, Width } from './types'

/** The four enums + layout tokens become data attributes; CSS owns what they mean. */
export function styled(props: StyledProps, extraClass?: string) {
  const className = [extraClass, props.class].filter(Boolean).join(' ') || undefined
  return {
    className,
    'data-variant': props.variant,
    'data-tone': props.tone,
    'data-size': props.size,
    'data-emphasis': props.emphasis,
    'data-width': reachOf(props.width),
    style: props.span ? ({ '--span': props.span } as Record<string, number>) : undefined,
  }
}

/** `page` is the column itself, so it draws no attribute. */
export function reachOf(width: unknown): Exclude<Width, 'page'> | undefined {
  return width === 'wide' || width === 'full' ? width : undefined
}
