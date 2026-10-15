import { createContext } from 'react'
import type { CanvasActions } from './types'

/** What a node can do to its canvas, handed down through React Flow's custom node boundary. */
export const CanvasContext = createContext<CanvasActions | null>(null)
