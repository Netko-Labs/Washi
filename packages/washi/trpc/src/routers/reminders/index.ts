import { mergeRouters } from '../../init'
import { reminderMutations } from './mutations'
import { reminderQueries } from './queries'

export const remindersRouter = mergeRouters(reminderQueries, reminderMutations)
