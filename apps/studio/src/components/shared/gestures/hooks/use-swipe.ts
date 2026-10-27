import { type RefObject, useEffect, useRef } from 'react'
import type { SwipeOptions, SwipeTrack } from '../types'
import { commits, isOwnGesture, LOCK_SLOP, travel } from '../utils'

const SETTLE = 'transform 220ms cubic-bezier(0.2, 0.8, 0.2, 1)'
const SETTLE_MS = 220

/**
 * A one-direction swipe on `handle`: the follower tracks the finger, and letting go far or fast
 * enough commits. Touch events, not pointer ones — a browser that claims a pan cancels pointers.
 */
export function useSwipe(handle: RefObject<HTMLElement | null>, options: SwipeOptions): void {
  const latest = useRef(options)
  latest.current = options

  useEffect(() => {
    const el = handle.current
    if (!el) return
    let track: SwipeTrack | null = null
    let follower: HTMLElement | null = null

    const place = (moved: number) => {
      if (!follower) return
      const { axis, sign } = latest.current
      follower.style.transition = 'none'
      follower.style.transform = `translate${axis.toUpperCase()}(${sign * moved}px)`
    }
    const settle = () => {
      if (!follower) return
      follower.style.transition = SETTLE
      follower.style.transform = ''
    }
    // Committed: the follower finishes the throw off-screen, then whatever it was closes. Its
    // styles clear only after that, so a drawer that stays mounted opens clean next time.
    const fling = () => {
      const thrown = follower
      const { axis, sign, onSwipe } = latest.current
      if (!thrown) return onSwipe()
      thrown.style.transition = SETTLE
      thrown.style.transform = `translate${axis.toUpperCase()}(${sign * 100}%)`
      setTimeout(() => {
        onSwipe()
        setTimeout(() => {
          thrown.style.transition = ''
          thrown.style.transform = ''
        }, SETTLE_MS)
      }, SETTLE_MS)
    }

    const start = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!touch || event.touches.length > 1) return
      if (latest.current.startsAt && !latest.current.startsAt(touch)) return
      track = { x: touch.clientX, y: touch.clientY, at: event.timeStamp, locked: null }
      follower = latest.current.follower?.(el) ?? null
    }
    const move = (event: TouchEvent) => {
      const touch = event.touches[0]
      if (!track || !touch) return
      const { axis, sign } = latest.current
      const dx = touch.clientX - track.x
      const dy = touch.clientY - track.y
      if (track.locked === null && Math.hypot(dx, dy) > LOCK_SLOP) {
        track.locked = isOwnGesture(axis, sign, dx, dy)
      }
      if (track.locked) place(travel(axis, sign, dx, dy))
    }
    const end = (event: TouchEvent) => {
      const touch = event.changedTouches[0]
      const done = track
      track = null
      if (!done?.locked || !touch) return
      const { axis, sign, distance } = latest.current
      const moved = travel(axis, sign, touch.clientX - done.x, touch.clientY - done.y)
      if (commits(moved, event.timeStamp - done.at, distance)) fling()
      else settle()
    }
    const cancel = () => {
      track = null
      settle()
    }

    el.addEventListener('touchstart', start, { passive: true })
    el.addEventListener('touchmove', move, { passive: true })
    el.addEventListener('touchend', end)
    el.addEventListener('touchcancel', cancel)
    return () => {
      el.removeEventListener('touchstart', start)
      el.removeEventListener('touchmove', move)
      el.removeEventListener('touchend', end)
      el.removeEventListener('touchcancel', cancel)
    }
  }, [handle])
}
