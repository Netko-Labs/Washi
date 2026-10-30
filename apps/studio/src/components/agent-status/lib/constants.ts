/** While a turn runs or waits on a person: often enough that "Working" never lies for long. */
export const STATUS_BUSY_POLL_MS = 5_000

/** Idle or parked: a glance. This reader's own asks and answers re-read it at once. */
export const STATUS_IDLE_POLL_MS = 30_000

/** Whether anything can think at all. Rarely changes, and a hosted check decrypts a key. */
export const INFERENCE_POLL_MS = 15_000
