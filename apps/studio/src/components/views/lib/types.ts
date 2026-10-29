import type { RoutineTab } from '@/components/routines'

export interface RoutineSearch {
  tab?: RoutineTab
  template?: string
}

export interface Titled {
  id: string
  title: string
}
