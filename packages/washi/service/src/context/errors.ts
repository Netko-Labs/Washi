/** A guide nobody may set as asked: said in words, never a crash. */
export class AgentGuideError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'AgentGuideError'
  }
}
