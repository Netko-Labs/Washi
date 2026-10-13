import type { StyledProps } from './types'

/** The four enums + layout tokens become data attributes; CSS owns what they mean. */
export function styled(props: StyledProps, extraClass?: string) {
  const className = [extraClass, props.class].filter(Boolean).join(' ') || undefined
  return {
    className,
    'data-variant': props.variant,
    'data-tone': props.tone,
    'data-size': props.size,
    'data-emphasis': props.emphasis,
    style: props.span ? ({ '--span': props.span } as Record<string, number>) : undefined,
  }
}
