/**
 * Hybrid logical clock. Stamps sort lexicographically across devices:
 * zero-padded ms wall clock, then a counter for same-ms events, then device id.
 */

export interface HlcClock {
  readonly deviceId: string
  now(): string
}

export function createHlcClock(deviceId: string): HlcClock {
  let lastMs = 0
  let counter = 0

  return {
    deviceId,
    now() {
      const ms = Date.now()
      if (ms > lastMs) {
        lastMs = ms
        counter = 0
      } else {
        counter += 1
      }
      const wall = lastMs.toString().padStart(14, '0')
      const seq = counter.toString(36).padStart(4, '0')
      return `${wall}-${seq}-${deviceId}`
    },
  }
}

export function compareHlc(a: string, b: string): number {
  return a < b ? -1 : a > b ? 1 : 0
}
