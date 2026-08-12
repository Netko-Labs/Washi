import { homedir } from 'node:os'
import { join } from 'node:path'
import { createRouter } from '@washi/desktop-api'
import { app, menu } from 'mirinjs'

// App data dir keyed on the bundle id. `mirin dev` gets a `-dev` suffix so
// development never reads or writes the installed app's database.
const appId = app.id ?? 'dev.netko.washi'
export const appDataDir = join(
  process.platform === 'darwin'
    ? join(homedir(), 'Library', 'Application Support')
    : process.platform === 'win32'
      ? (process.env.APPDATA ?? join(homedir(), 'AppData', 'Roaming'))
      : (process.env.XDG_DATA_HOME ?? join(homedir(), '.local', 'share')),
  app.isDev ? `${appId}-dev` : appId,
)

app.serve(createRouter())

app.on('ready', async () => {
  await app.windows.open('main')
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
