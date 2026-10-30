import { mergeRouters } from '../../init'
import { unsplashMutations } from './mutations'
import { unsplashQueries } from './queries'

export const unsplashRouter = mergeRouters(unsplashQueries, unsplashMutations)
