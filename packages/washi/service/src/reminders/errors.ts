export class ReminderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ReminderError'
  }
}
