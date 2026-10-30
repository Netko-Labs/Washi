/**
 * How a Terminal's frame starts (D119): its screen drawn, the program held unrun until the page
 * says Run — which it says only from the person's press — with the Terminal's files handed in.
 */
export const TERMINAL_BOOT = `
let program = null
let isStarted = false

function start(given) {
  isStarted = true
  alive = true
  for (const [where, bytes] of Object.entries(given ?? {})) {
    if (ArrayBuffer.isView(bytes)) keepFile(where, bytes)
  }
  install()
  resetScreen('')
  guard(program)
  settle()
}

addEventListener('message', (event) => {
  if (event.source !== parent || !event.data || !event.data.washi) return
  const message = event.data
  if (message.type === 'run' && program && !isStarted) start(message.files)
  if (message.type === 'stop') halt(null)
})
addEventListener('error', (event) => {
  event.preventDefault()
  crash(event.error ?? new Error(event.message))
})
addEventListener('unhandledrejection', (event) => {
  event.preventDefault()
  crash(event.reason)
})

export function boot(load) {
  program = load
  mountScreen()
  resetScreen('Press ▶ Run')
}
`
