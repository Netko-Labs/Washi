import type { WsxElement, WsxValue } from '@washi/wsx'
import type { SheetLook } from './types'

/** The page's own paper — theme, feel, accent — read off its `<Sheet>`, for anything drawn beside it. */
export function frameOf(root: WsxElement): SheetLook {
  const pick = (value: WsxValue | undefined) => (typeof value === 'string' ? value : undefined)
  return {
    theme: pick(root.props.theme),
    feel: pick(root.props.feel),
    accent: pick(root.props.accent),
  } as SheetLook
}
