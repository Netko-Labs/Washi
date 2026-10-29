import type { Workspace } from '@washi/repository'
import type { DevCommand } from '@washi/trpc'

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

export interface WindowStore {
  read(): WindowState
  write(state: WindowState): void
}

export interface DevMenuDeps {
  /** Where the workspace lives, for "Reveal data folder". */
  appDataDir: string
  ws: Workspace
  /** Broadcasts to the renderer; it owns localStorage and the reload. */
  send: (command: DevCommand) => void
}
