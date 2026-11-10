export class TsuruError extends Error {
  readonly needsApproval: boolean

  constructor(message: string, needsApproval = false) {
    super(message)
    this.name = 'TsuruError'
    this.needsApproval = needsApproval
  }
}
