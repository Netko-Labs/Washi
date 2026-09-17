import { homedir } from 'node:os'
import { join } from 'node:path'
import { DEFAULT_WORKSPACE_ID, startServer } from '@washi/server'
import { app, devtools, type MenuItemTemplate, menu } from 'mirinjs'
import { developMenu } from './dev-menu'
import { seedShowcase } from './showcase'
import { createWindowStore } from './window-store'

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

// The desktop app is a client of its own server (C4). Embedded mode binds
// loopback on an OS-assigned port; the renderer is handed the origin and does
// not otherwise know it is local.
const server = startServer({ mode: 'embedded', dataDir: join(appDataDir, 'workspaces') })
const runtime = server.runtime
const { workspace } = runtime.resolve(DEFAULT_WORKSPACE_ID)

console.log(`[Washi] storage at ${appDataDir} · server at ${server.url}`)
seedShowcase(workspace)

const windowStore = createWindowStore(appDataDir)
const uiUrl = `app://ui/index.html?server=${encodeURIComponent(server.url)}`

devtools.expose('store', () => ({
  server: server.url,
  workspace: workspace.id,
}))

app.on('ready', async () => {
  const saved = windowStore.read()
  const win = await app.windows.open({
    name: 'main',
    url: uiUrl,
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
        const current = windowStore.read()
        if (!current.isMaximized) windowStore.write({ ...current, isMaximized: true })
        return
      }
      const frame = win.getFrame()
      if (frame.width > 0 && frame.height > 0) {
        windowStore.write({
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
  const appMenu: MenuItemTemplate[] = [
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
  ]

  // Every Develop item destroys data without touching the oplog — dev only.
  if (app.isDev) {
    appMenu.push(
      developMenu({
        appDataDir,
        ws: workspace,
        send: (command) => runtime.events.emit('devCommand', { command }),
      }),
    )
  }

  menu.setApplicationMenu(appMenu)
})

app.on('window-all-closed', () => {
  void server.stop().then(() => app.quit())
})
