import { mergeRouters } from '../../init'
import { emojiMutations } from './mutations'
import { emojiQueries } from './queries'

export const emojisRouter = mergeRouters(emojiQueries, emojiMutations)
