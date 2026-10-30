export const MAX_TRPC_BODY_BYTES = 1024 * 1024
/** The client's httpBatchLink splits at this too. */
export const MAX_TRPC_BATCH_SIZE = 20
/** The longest URL the client sends: a batch of GETs past it splits, well under what a proxy takes. */
export const MAX_TRPC_URL_LENGTH = 8000
