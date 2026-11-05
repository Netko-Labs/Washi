/** Why a picture could not be drawn, in words an agent can act on. */
export class ImageRenderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = 'ImageRenderError'
  }
}
