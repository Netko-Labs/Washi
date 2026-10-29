import { IconLayoutSidebarRight, IconSquare } from '@tabler/icons-react'
import type { PeekMode, PeekModeOption } from './types'

const SIDE_PEEK: PeekModeOption = { mode: 'side', label: 'Side peek', icon: IconLayoutSidebarRight }
const CENTER_PEEK: PeekModeOption = { mode: 'center', label: 'Center peek', icon: IconSquare }

/** The bar offers the mode the peek is not in. */
export const PEEK_TOGGLE: Record<PeekMode, PeekModeOption> = {
  side: CENTER_PEEK,
  center: SIDE_PEEK,
}

export const PEEK_FRAME: Record<PeekMode, string> = {
  side: 'inset-y-0 right-0 w-[min(860px,64vw)] min-w-[min(560px,100vw)] border-l shadow-[-28px_0_72px_rgb(0_0_0/0.16)] slide-in-from-right-10',
  center:
    'top-[4vh] left-[max(3vw,calc(50%-520px))] h-[92vh] w-[min(1040px,94vw)] rounded-2xl border shadow-[0_32px_96px_rgb(0_0_0/0.32)] zoom-in-95',
}
