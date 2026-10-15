import { useContext } from 'react'
import type { CanvasActions } from '../types'
import { CanvasContext } from '../values'

export function useCanvasActions(): CanvasActions {
  const actions = useContext(CanvasContext)
  if (!actions) throw new Error('an idea node renders inside a Canvas')
  return actions
}
