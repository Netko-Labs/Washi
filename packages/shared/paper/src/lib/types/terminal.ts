import type { BlockProps } from './style'

/** What `useFile` hands back: an upload's text, its JSON read, or its bytes. */
export type FileAs = 'text' | 'json' | 'bytes'

export interface TerminalProps extends BlockProps {
  title?: string
  height?: number
  /** A path the program reads → the upload it is (`file:<id>`). */
  files?: Record<string, string>
  /** The Terminal's text: Node-style JS, run only from a press. */
  program: string
}

export type TerminalState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'running' }
  | { status: 'stopped' }
  | { status: 'exited'; code: number }
  | { status: 'failed'; reason: string }

/** How a frame's document differs from a widget's: its own style, its own way of saying it stopped. */
export interface FrameLook {
  style?: string
  onerror?: string
}
