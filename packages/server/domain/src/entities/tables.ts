import { tableSpecSchema } from '@washi/ink'
import { z } from 'zod'

export const userTableSchema = z.object({
  id: z.string(),
  name: z.string(),
  spec: tableSpecSchema,
  hlcUpdated: z.string(),
})
export type UserTable = z.infer<typeof userTableSchema>

export interface WindowState {
  x: number
  y: number
  width: number
  height: number
  isMaximized: boolean
}

export const DEFAULT_WINDOW_STATE: WindowState = {
  x: 120,
  y: 120,
  width: 1280,
  height: 820,
  isMaximized: false,
}
