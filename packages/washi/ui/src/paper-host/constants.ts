export const MB = 1024 * 1024
/** How long the server's read cap is believed before it is asked again. */
export const CAP_FRESH_MS = 60_000
/** Uploads kept in memory once read: a Terminal's frames file is tens of MB. */
export const KEPT_UPLOADS = 4
