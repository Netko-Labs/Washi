import { IconLayoutSidebarRight, IconSquare } from '@tabler/icons-react'
import type { PeekMode } from './types'

export const PEEK_MODES: { mode: PeekMode; label: string; icon: typeof IconSquare }[] = [
  { mode: 'side', label: 'Side peek', icon: IconLayoutSidebarRight },
  { mode: 'center', label: 'Center peek', icon: IconSquare },
]

export const PEEK_FRAME: Record<PeekMode, string> = {
  side: 'inset-y-0 right-0 w-[min(720px,58vw)] min-w-[440px] border-l shadow-[-28px_0_72px_rgb(0_0_0/0.16)] slide-in-from-right-10',
  center:
    'top-[5vh] left-[max(4vw,calc(50%-460px))] h-[90vh] w-[min(920px,92vw)] rounded-2xl border shadow-[0_32px_96px_rgb(0_0_0/0.32)] zoom-in-95',
}
