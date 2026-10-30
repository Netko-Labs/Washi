export class FetchHostError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'FetchHostError'
  }
}

export class PagePackageError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'PagePackageError'
  }
}
