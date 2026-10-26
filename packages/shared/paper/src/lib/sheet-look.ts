import type { WsxElement, WsxValue } from '@washi/wsx'
import type { SheetLook } from './types'

/** The page's own paper and look — theme, feel, accent, icon, cover — read off its `<Sheet>`. */
export function frameOf(root: WsxElement): SheetLook {
  const pick = (value: WsxValue | undefined) => (typeof value === 'string' ? value : undefined)
  return {
    theme: pick(root.props.theme),
    feel: pick(root.props.feel),
    accent: pick(root.props.accent),
    icon: pick(root.props.icon),
    cover: pick(root.props.cover),
  } as SheetLook
}
