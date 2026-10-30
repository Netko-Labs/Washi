import { useDialogFocus } from '@washi/ui'
import { useRef } from 'react'
import { createPortal } from 'react-dom'
import { useDismiss } from '@/components/shared/dismiss'
import type { BottomSheetProps } from './types'

/**
 * A phone's menu: a scrim and a card risen from the bottom edge, clear of the home indicator.
 * Drawn on the body, so neither the header's container nor the drawer clips it; the card is
 * `data-floating`, so an opener's own `useDismiss` counts a press in it as inside.
 */
export function BottomSheet({ label, onClose, children }: BottomSheetProps) {
  const card = useRef<HTMLDivElement>(null)
  useDismiss(card, true, onClose)
  useDialogFocus(card, true, { trap: true })

  return createPortal(
    <>
      <div
        aria-hidden
        className="fade-in fixed inset-0 z-[60] animate-in bg-black/40 duration-200"
      />
      <div
        ref={card}
        data-floating
        role="dialog"
        aria-modal
        aria-label={label}
        className="fade-in slide-in-from-bottom-8 fixed inset-x-0 bottom-0 z-[60] max-h-[85dvh] animate-in overflow-y-auto overscroll-contain rounded-t-2xl bg-popover pt-2 pr-[max(8px,env(safe-area-inset-right))] pb-[max(8px,env(safe-area-inset-bottom))] pl-[max(8px,env(safe-area-inset-left))] text-popover-foreground shadow-[0_-16px_48px_rgb(0_0_0/0.18)] duration-200 ease-out"
      >
        {children}
      </div>
    </>,
    document.body,
  )
}
