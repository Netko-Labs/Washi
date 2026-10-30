import { useRef } from 'react'
import { useDismiss } from '@/components/shared/dismiss'
import { Floating } from '@/components/shared/floating'
import { useUnsplashPickStore } from './lib'
import { UnsplashPanel } from './unsplash-panel'

/** Where an asked-for photo is picked: under the block that asked, closed by a press outside. */
export function UnsplashPick() {
  const open = useUnsplashPickStore((state) => state.open)
  const root = useRef<HTMLDivElement>(null)
  useDismiss(root, open !== null, useUnsplashPickStore.getState().dismiss)
  if (!open) return null

  return (
    <Floating anchor={open.anchor} role="dialog" aria-label="Pick a photo from Unsplash">
      <div
        ref={root}
        className="w-[300px] rounded-xl border border-border bg-popover p-2 font-sans text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]"
      >
        <p className="px-1 pb-1.5 font-semibold text-[11px] text-muted-foreground uppercase tracking-[0.06em]">
          Unsplash
        </p>
        <UnsplashPanel onPicked={open.settle} />
      </div>
    </Floating>
  )
}
