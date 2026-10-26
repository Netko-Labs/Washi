export const PROMISES = [
  { mark: '+', text: 'pages you ask for, designed rather than typed' },
  { mark: '?', text: 'anything that leaves your server asks first, every time' },
  { mark: '$', text: 'a daily stop, so a loop cannot run all night on your key' },
] as const

export const DEFAULT_DAILY_STOP_USD = 25

/** What `/new` already did by the time a workspace asks for its key. */
export const DONE_STEPS = ['Name it', 'Start it', 'Invite people']
