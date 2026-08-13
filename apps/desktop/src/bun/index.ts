import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRouter } from '@washi/desktop-api'
import {
  getWindowState,
  initializeDb,
  listSheets,
  listTables,
  saveWindowState,
} from '@washi/desktop-repository'
import { AgentHost } from '@washi/desktop-service'
import { app, devtools, menu } from 'mirinjs'
import { seedShowcase } from './showcase'

// App data dir keyed on the bundle id. `mirin dev` gets a `-dev` suffix so
// development never reads or writes the installed app's database.
const appId = app.id ?? 'dev.netko.washi'
const appDataDir = join(
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')),
  app.isDev ? `${appId}-dev` : appId,
)

initializeDb(join(appDataDir, 'washi.db'))
console.log(`[Washi] storage at ${appDataDir}`)

seedShowcase()

const agents = new AgentHost()
const served = app.serve(createRouter(agents))
agents.setEvents({
  update: (sessionId, entry) => served.rpc.agentUpdate.broadcast({ sessionId, entry }),
  approval: (request) => served.rpc.approvalRequested.broadcast(request),
  openSheet: (id) => served.rpc.openSheetRequested.broadcast({ id }),
})

devtools.expose('store', () => ({
  sheets: listSheets().length,
  tables: listTables().length,
}))

app.on('ready', async () => {
  const saved = getWindowState()
  const win = await app.windows.open({
    name: 'main',
    url: 'app://ui/index.html',
    title: 'Washi',
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 13, y: 13 },
    show: 'ready',
    minWidth: 880,
    minHeight: 600,
    x: saved.x,
    y: saved.y,
    width: saved.width,
    height: saved.height,
  })

  if (saved.isMaximized) setTimeout(() => void win.maximize(), 150)

  // Persist the frame periodically; while maximized only flip the flag so
  // un-maximizing returns to the last normal size.
  const saveInterval = setInterval(() => {
    try {
      if (win.isMaximized()) {
        const current = getWindowState()
        if (!current.isMaximized) saveWindowState({ ...current, isMaximized: true })
        return
      }
      const frame = win.getFrame()
      if (frame.width > 0 && frame.height > 0) {
        saveWindowState({
          x: Math.round(frame.x),
          y: Math.round(frame.y),
          width: Math.round(frame.width),
          height: Math.round(frame.height),
          isMaximized: false,
        })
      }
    } catch {
      // window may be closing; ignore
    }
  }, 2000)

  win.on('closed', () => clearInterval(saveInterval))
})

app.on('ready', () => {
  menu.setApplicationMenu([
    {
      label: 'Washi',
      submenu: [
        { role: 'hide' },
        { role: 'hideothers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit', accelerator: 'Cmd+Q' },
      ],
    },
    { label: 'File', submenu: [{ role: 'close' }] },
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        { role: 'selectall' },
      ],
    },
    { label: 'View', submenu: [{ role: 'togglefullscreen' }] },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { type: 'separator' }, { role: 'front' }],
    },
  ])
})

app.on('window-all-closed', () => {
  app.quit()
})
