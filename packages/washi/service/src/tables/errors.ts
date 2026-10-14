export class InkError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'InkError'
  }
}
