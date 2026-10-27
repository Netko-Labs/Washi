import type { ExprLimits } from './types'

export const EXPR_LIMITS: ExprLimits = { budget: 2000, depth: 24 }
export const EXPR_MAX_SOURCE_LENGTH = 512
export const MS_PER_DAY = 86_400_000

export const AGGREGATE_NAMES = ['count', 'sum', 'avg', 'min', 'max'] as const
export const FUNCTION_NAMES = ['now', 'days', 'month', 'year', 'when'] as const

/** How many arguments each function takes. */
export const FUNCTION_ARITY: Record<(typeof FUNCTION_NAMES)[number], number> = {
  now: 0,
  days: 2,
  month: 1,
  year: 1,
  when: 3,
}
export const KEYWORDS = ['and', 'or', 'not', 'where', 'true', 'false', 'null'] as const
export const ROW_ARG = '$row'
export const SCOPE_ARG = '$scope'
