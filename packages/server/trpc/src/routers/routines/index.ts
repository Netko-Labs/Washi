import { mergeRouters } from '../../init'
import { routineMutations } from './mutations'
import { routineQueries } from './queries'

export const routinesRouter = mergeRouters(routineQueries, routineMutations)
