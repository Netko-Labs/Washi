/**
 * How many events per name stay replayable. A client that reconnects inside the
 * buffer resumes without a gap; past it, it resumes live and misses the middle —
 * which is why the buffer is generous relative to a laptop lid closing.
 */
export const EVENT_BUFFER_SIZE = 256
