import { clearAgentHistory, clearCapabilityLedger, eraseVault, vaultStats } from '@washi/repository'
import type { DevCommand } from '@washi/trpc'
import { dialog, type MenuItemTemplate } from 'mirinjs'
import { seedShowcase } from './showcase'

export interface DevMenuDeps {
  /** Where the vault lives, for "Reveal data folder". */
  appDataDir: string
  /** Broadcasts to the renderer; it owns localStorage and the reload. */
  send: (command: DevCommand) => void
}

async function confirmDestructive(message: string, detail: string): Promise<boolean> {
  const { button } = await dialog.message({
    message,
    detail,
    buttons: ['Cancel', 'Erase'],
  })
  return button === 1
}

function reveal(path: string): void {
  Bun.spawn([process.platform === 'darwin' ? 'open' : 'xdg-open', path])
}

/**
 * Dev-only escape hatches for getting back to a known state. Mounted only when
 * `app.isDev`, because every item here destroys data without touching the oplog.
 */
export function developMenu({ appDataDir, send }: DevMenuDeps): MenuItemTemplate {
  return {
    label: 'Develop',
    submenu: [
      { label: 'Reload Window', accelerator: 'Cmd+R', click: () => send('reload') },
      { type: 'separator' },

      { label: 'Restart Onboarding', click: () => send('reset-onboarding') },
      { label: 'Reset Identity', click: () => send('reset-identity') },
      { label: 'Clear Renderer State', click: () => send('clear-local-state') },
      { type: 'separator' },

      {
        label: 'Reseed Showcase Sheets',
        click: () => {
          seedShowcase()
          send('reload')
        },
      },
      {
        label: 'Clear Agent History',
        click: () => {
          clearAgentHistory()
          send('reload')
        },
      },
      {
        label: 'Clear Capability Ledger',
        click: () => {
          clearCapabilityLedger()
          send('reload')
        },
      },
      { type: 'separator' },

      {
        label: 'Erase All Washi Data…',
        click: () => {
          void (async () => {
            const stats = vaultStats()
            const ok = await confirmDestructive(
              'Erase this vault?',
              `${stats.sheets} sheets, ${stats.tables} tables (${stats.records} records), ` +
                `${stats.sessions} agent sessions and ${stats.oplogEntries} oplog entries are ` +
                'deleted permanently. Showcase sheets are reseeded afterwards. This cannot be undone.',
            )
            if (!ok) return
            eraseVault()
            seedShowcase()
            send('clear-local-state')
          })()
        },
      },
      { type: 'separator' },

      { label: 'Reveal Data Folder', click: () => reveal(appDataDir) },
      {
        label: 'Log Vault Stats',
        click: () => console.log('[Washi] vault', vaultStats()),
      },
    ],
  }
}
