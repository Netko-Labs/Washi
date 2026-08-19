import { rpc } from 'mirinjs/rpc'

/**
 * Develop-menu commands that only the renderer can carry out — onboarding and
 * identity live in localStorage, and a reload has to happen in the webview.
 * Registered unconditionally; the menu that broadcasts them is dev-only.
 */
export type DevCommand = 'reload' | 'reset-onboarding' | 'reset-identity' | 'clear-local-state'

export function devRoutes() {
  return {
    devCommand: rpc.event<{ command: DevCommand }>(),
  }
}
