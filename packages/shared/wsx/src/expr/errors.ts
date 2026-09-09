import type { ExprLimitKind } from './types'

export class ExprSyntaxError extends Error {
  readonly offset: number

  constructor(message: string, offset: number) {
    super(message)
    this.name = 'ExprSyntaxError'
    this.offset = offset
  }
}

export class ExprBudgetError extends Error {
  readonly limit: ExprLimitKind

  constructor(limit: ExprLimitKind, max: number) {
    super(
      limit === 'depth'
        ? `expression nests deeper than ${max} levels`
        : `expression exceeded its step budget of ${max}`,
    )
    this.name = 'ExprBudgetError'
    this.limit = limit
  }
}

export class ExprEvalError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ExprEvalError'
  }
}
