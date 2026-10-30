import { useShallow } from 'zustand/react/shallow'
import type { TurnView } from '../../../stores'
import { turnViewOf, useAgentStore } from '../../../stores'

/** The chat on screen as one state: idle · working · stalled · failed (D114). */
export function useTurnView(): TurnView {
  return useAgentStore(useShallow(turnViewOf))
}
