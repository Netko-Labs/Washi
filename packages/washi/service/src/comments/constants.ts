import type { CommentAuthor } from '@washi/domain'

/** Embedded mode has no sessions: the one person at the machine signs as "You". */
export const LOCAL_AUTHOR: CommentAuthor = { id: 'local', name: 'You' }
