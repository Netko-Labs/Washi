import { useRef } from 'react'
import { useSwipe } from '@/components/shared/gestures'
import { DRAWER_EDGE, DRAWER_SWIPE, useShellStore } from './lib'

/** The left edge of a phone's page: a swipe right from it pulls the sidebar out. */
export function DrawerEdge() {
  const strip = useRef<HTMLDivElement>(null)
  useSwipe(strip, {
    axis: 'x',
    sign: 1,
    distance: DRAWER_SWIPE / 2,
    onSwipe: () => useShellStore.getState().setDrawer(true),
  })
  return (
    <div
      ref={strip}
      aria-hidden
      className="fixed inset-y-0 left-0 z-30 touch-none"
      style={{ width: DRAWER_EDGE }}
    />
  )
}
