/** How long a settled read answers again; a live change or a write forgets it sooner. */
export const READ_FRESH_MS = 10_000
/** `agents.inference` under `sharedAsks`: every host-side reader asks it under this one key. */
export const INFERENCE_ASK = 'agents.inference'
