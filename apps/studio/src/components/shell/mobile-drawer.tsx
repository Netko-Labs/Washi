import { useRef } from 'react'
import { useSwipe } from '@/components/shared/gestures'
import { Sidebar } from '@/components/sidebar'
import { DRAWER_SWIPE, type MobileDrawerProps, useShellStore } from './lib'

/**
 * Under `md`: the whole sidebar as a full-screen menu. ✕, a swipe back to the left or a pick
 * closes it. It is drawn once and only slides, so opening it is a transform, never a mount.
 */
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
      inert={!isOpen}
      className={`fixed inset-0 z-50 touch-pan-y transition-[translate,visibility] duration-[280ms] ease-[cubic-bezier(0.32,0.72,0,1)] will-change-[translate] motion-reduce:transition-none ${
        isOpen ? 'visible translate-x-0' : 'invisible -translate-x-full'
      }`}
    >
      <Sidebar
        workspace={workspace}
        folded={false}
        peeking={false}
        drawer
        onFold={close}
        onPeekEnd={close}
      />
    </div>
  )
}
