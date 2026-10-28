import { mergeRouters } from '../../init'
import { themeMutations } from './mutations'
import { themeQueries } from './queries'

export const themesRouter = mergeRouters(themeQueries, themeMutations)
