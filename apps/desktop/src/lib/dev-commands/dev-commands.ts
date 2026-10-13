import type { DevCommand } from '@washi/trpc'
import { api } from '@/lib/rpc'
import { IDENTITY_KEY, ONBOARDED_KEY } from '@/stores/view/view-store'

/**
 * Renderer half of the Develop menu. Onboarding and identity are localStorage,
 * so the main process can only ask — this does the clearing and the reload.
 */
const HANDLERS: Record<DevCommand, () => void> = {
  reload: () => {},
  'reset-onboarding': () => localStorage.removeItem(ONBOARDED_KEY),
  'reset-identity': () => localStorage.removeItem(IDENTITY_KEY),
  'clear-local-state': () => localStorage.clear(),
}

export function subscribeDevCommands(): void {
  api.dev.onDevCommand.subscribe(undefined, {
    onData: ({ data: { command } }) => {
      HANDLERS[command]?.()
      window.location.reload()
    },
  })
}
