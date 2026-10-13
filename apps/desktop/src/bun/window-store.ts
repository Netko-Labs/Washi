import { mkdirSync, readFileSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

const DEFAULT_WINDOW_STATE: WindowState = {
  x: 120,
  y: 120,
  width: 1280,
  height: 820,
  isMaximized: false,
}

export interface WindowStore {
  read(): WindowState
  write(state: WindowState): void
}

/**
 * Where the window sits is a property of this machine, not of any workspace — a
 * server has no windows, and a synced workspace must not carry somebody else's
 * monitor geometry. So it lives beside the app data in a file of its own.
 */
export function createWindowStore(appDataDir: string): WindowStore {
  const path = join(appDataDir, 'window.json')

  return {
    read() {
      try {
        const parsed = JSON.parse(readFileSync(path, 'utf8')) as Partial<WindowState>
        if (typeof parsed.width !== 'number' || typeof parsed.height !== 'number') {
          return DEFAULT_WINDOW_STATE
        }
        return { ...DEFAULT_WINDOW_STATE, ...parsed }
      } catch {
        return DEFAULT_WINDOW_STATE
      }
    },

    write(state) {
      try {
        mkdirSync(appDataDir, { recursive: true })
        writeFileSync(path, JSON.stringify(state))
      } catch {
        // a window that cannot remember where it was is not worth crashing over
      }
    },
  }
}
