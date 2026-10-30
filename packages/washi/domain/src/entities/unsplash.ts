import { z } from 'zod'

export const unsplashPhotoIdSchema = z.string().regex(/^[A-Za-z0-9_-]{1,64}$/)

/** A photo a page wears as `unsplash:<id>`: Unsplash's own hotlinks and its credit, kept on pick. */
export const unsplashPhotoSchema = z.object({
  id: unsplashPhotoIdSchema,
  regularUrl: z.string(),
  fullUrl: z.string(),
  photographer: z.string(),
  profileUrl: z.string(),
  pageUrl: z.string(),
  pickedBy: z.string().nullable(),
  hlcPicked: z.string(),
})
export type UnsplashPhotoRow = z.infer<typeof unsplashPhotoSchema>
