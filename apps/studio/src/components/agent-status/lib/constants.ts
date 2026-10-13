/** Cheap on the server; frequent enough that "Working" never lies for long. */
export const STATUS_POLL_MS = 5_000

/** Whether anything can think at all. Rarely changes, and a hosted check decrypts a key. */
export const INFERENCE_POLL_MS = 15_000
