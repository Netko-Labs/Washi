/** Said to the visitor in words: a limit reached, a cell that does not fit, a time taken. */
export class SuggestionRefusedError extends Error {
  readonly isLimit: boolean
  constructor(message: string, isLimit = false) {
    super(message)
    this.name = 'SuggestionRefusedError'
    this.isLimit = isLimit
  }
}

/** Said to the member deciding: decided already, or no longer fits its table. */
export class SuggestionError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'SuggestionError'
  }
}
