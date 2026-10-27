import { useRef } from 'react'
import { useSwipe } from '@/components/shared/gestures'
import { Sidebar } from '@/components/sidebar'
import { DRAWER_SWIPE, type MobileDrawerProps, useShellStore } from './lib'

/** Under `md`: the whole sidebar as a full-screen menu. ✕, a swipe back to the left or a pick closes it. */
export function MobileDrawer({ workspace }: MobileDrawerProps) {
  const isOpen = useShellStore((state) => state.drawer)
  const panel = useRef<HTMLDivElement>(null)
  const close = () => useShellStore.getState().setDrawer(false)
  useSwipe(panel, {
    axis: 'x',
    sign: -1,
    distance: DRAWER_SWIPE,
    follower: (el) => el,
    onSwipe: close,
  })

  return (
    <div
      ref={panel}
      role="dialog"
      aria-modal
      aria-label="Menu"
      className={`slide-in-from-left-12 fade-in fixed inset-0 z-50 animate-in touch-pan-y duration-200 ease-out ${
        isOpen ? '' : 'hidden'
      }`}
    >
      {isOpen && (
        <Sidebar
          workspace={workspace}
          folded={false}
          peeking={false}
          drawer
          onFold={close}
          onPeekEnd={close}
        />
      )}
    </div>
  )
}
