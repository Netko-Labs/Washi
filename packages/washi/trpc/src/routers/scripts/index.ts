import { mergeRouters } from '../../init'
import { scriptQueries } from './queries'

export const scriptsRouter = mergeRouters(scriptQueries)
