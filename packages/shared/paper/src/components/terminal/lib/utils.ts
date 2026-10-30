import type { TerminalState } from '../../../lib/types'

/** The caption's word for where a run is. */
export function statusWords(state: TerminalState, files: Record<string, string> | undefined) {
  if (state.status === 'loading') {
    const names = Object.keys(files ?? {})
    return names.length > 0 ? `Reading ${names.join(', ')}…` : 'Starting…'
  }
  if (state.status === 'running') return 'Running'
  if (state.status === 'stopped') return 'Stopped'
  if (state.status === 'exited') return state.code === 0 ? 'Done' : `Exited with code ${state.code}`
  if (state.status === 'failed') return `Couldn’t start — ${state.reason}`
  return ''
}

export const isBusy = (state: TerminalState) =>
  state.status === 'loading' || state.status === 'running'
