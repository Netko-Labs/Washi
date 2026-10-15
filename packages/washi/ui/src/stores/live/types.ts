export interface LiveState {
  /** Listens for what moved in the workspace; once per workspace, closed by `disconnect`. */
  connect: () => void
  disconnect: () => void
  /** Table data moved somewhere else — a teammate, a routine, Washi. */
  onData: (listener: () => void) => () => void
}
