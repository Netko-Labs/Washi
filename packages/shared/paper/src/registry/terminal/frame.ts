import { TERMINAL_BOOT } from './boot'
import { TERMINAL_EVENTS } from './events'
import { TERMINAL_FORMAT } from './format'
import { TERMINAL_MODULES } from './modules'
import { TERMINAL_NODE } from './node'
import { TERMINAL_PROCESS } from './process'
import { TERMINAL_SCREEN } from './screen'

/** What `washi` is inside a Terminal's frame: one module, in the order each part reads the last. */
export const TERMINAL_FRAME = [
  TERMINAL_FORMAT,
  TERMINAL_SCREEN,
  TERMINAL_NODE,
  TERMINAL_EVENTS,
  TERMINAL_PROCESS,
  TERMINAL_MODULES,
  TERMINAL_BOOT,
].join('\n')
