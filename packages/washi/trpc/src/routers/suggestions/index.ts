import { mergeRouters } from '../../init'
import { suggestionMutations } from './mutations'
import { suggestionQueries } from './queries'

export const suggestionsRouter = mergeRouters(suggestionQueries, suggestionMutations)
