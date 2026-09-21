/**
 * A 44px tap target without a 44px control. The pseudo-element extends the hit
 * box past the visual bounds, so nothing in the layout moves — and it is scoped
 * to coarse pointers, because on a mouse these invisible boxes would swallow
 * clicks meant for whatever sits next to them.
 *
 * -inset-3.5 is 14px a side: a size-4 checkbox becomes 44px, an h-5 switch 48px.
 */
export const TOUCH_TARGET =
  'relative pointer-coarse:before:absolute pointer-coarse:before:-inset-3.5 pointer-coarse:before:content-[""]'

/** Range inputs get a real thumb instead of a hairline on touch. */
export const TOUCH_RANGE = 'pointer-coarse:h-11 touch-manipulation'
