import type { api } from '@/integrations/trpc'

export type RoutineWire = Awaited<ReturnType<typeof api.routines.list.query>>[number]

export interface RoutineRowProps {
  routine: RoutineWire
  onToggle: (id: string, enabled: boolean) => void
  onRunNow: (id: string) => void
  onRemove: (id: string) => void
}

export interface RoutineFormProps {
  onCreate: (input: RoutineInput) => Promise<boolean>
}

export interface RoutineDraft {
  title: string
  prompt: string
  /** HH:MM on this device's clock. */
  time: string
}

export interface RoutineInput {
  title: string
  prompt: string
  minuteOfDay: number
  timeZone: string
}
