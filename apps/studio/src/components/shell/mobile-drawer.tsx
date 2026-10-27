import { useRef } from 'react'
import { useSwipe } from '@/components/shared/gestures'
import { Sidebar } from '@/components/sidebar'
import { DRAWER_SWIPE, type MobileDrawerProps, useShellStore } from './lib'

/** Under `md`: the whole sidebar over the page. A swipe back to the left, the shade or a pick closes it. */
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
    <div className={isOpen ? 'contents' : 'hidden'}>
      <div
        aria-hidden
        onClick={close}
        className="fade-in fixed inset-0 z-40 animate-in bg-black/40 duration-200"
      />
      <div
        ref={panel}
        role="dialog"
        aria-modal
        aria-label="Sidebar"
        className="slide-in-from-left fixed inset-y-0 left-0 z-50 animate-in touch-pan-y duration-200 ease-out"
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
    </div>
  )
}
