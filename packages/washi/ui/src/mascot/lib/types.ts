export type AgentMascotState =
  | 'idle'
  | 'reading'
  | 'thinking'
  | 'writing'
  | 'suggesting'
  | 'done'
  | 'flagged'
  | 'resting'

export type MascotFace = 'happy' | 'sleep' | 'curious' | 'sad' | 'dizzy' | 'wink' | 'blank'
export type MascotMotion = 'none' | 'flip' | 'bob' | 'peek' | 'breathe' | 'sway'
