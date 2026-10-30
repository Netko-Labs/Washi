import type { Starter } from './types'

export const MAKE_A_PAGE: Starter = {
  label: 'Make a page for …',
  prompt: 'Make a page for ',
  sends: false,
}

/** For a workspace with nothing in it yet: asks that name nothing that isn't there. */
export const GENERIC_STARTERS: Starter[] = [
  MAKE_A_PAGE,
  { label: 'Start a table to track …', prompt: 'Start a table to track ', sends: false },
  {
    label: 'What can you do in this workspace?',
    prompt: 'What can you do in this workspace?',
    sends: true,
  },
]
