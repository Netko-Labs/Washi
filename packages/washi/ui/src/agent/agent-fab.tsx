import { useShallow } from 'zustand/react/shallow'
import { AgentMascot } from '../mascot'
import { mascotStateFor, useAgentStore } from '../stores'
import { useFabShortcut } from './lib'

/**
 * The mascot door: the whole tile on a squircle, so Washi's face and state read at a glance.
 * ⌘J and this button open the panel. `corner-shape` falls back to plain rounding where unknown.
 */
export function AgentFab() {
  const { togglePanel, transcript, running, approvals } = useAgentStore(
    useShallow((state) => ({
      togglePanel: state.togglePanel,
      transcript: state.transcript,
      running: state.running,
      approvals: state.approvals,
    })),
  )
  useFabShortcut(togglePanel)

  return (
    <button
      type="button"
      data-agent-fab
      aria-label="Ask Washi (⌘J)"
      title="Ask Washi (⌘J)"
      onClick={togglePanel}
      className="fixed right-6 bottom-6 z-[48] size-[60px] max-md:right-4 max-md:bottom-[calc(16px+env(safe-area-inset-bottom))] max-md:size-14 overflow-hidden rounded-[22px] bg-card ring-2 ring-card shadow-[0_8px_28px_rgb(0_0_0/0.18)] transition-[transform,box-shadow] duration-150 [corner-shape:squircle] hover:-translate-y-px hover:shadow-[0_12px_34px_rgb(0_0_0/0.24)] supports-[corner-shape:squircle]:rounded-[32%]"
    >
      <AgentMascot state={mascotStateFor(transcript, running, approvals)} size={60} />
    </button>
  )
}
