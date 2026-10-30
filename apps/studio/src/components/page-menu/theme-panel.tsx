import { IconCheck, IconSettings } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { THEME_IDS, THEMES, type ThemePair } from '@washi/paper/registry'
import { useSheetsStore, useThemesStore } from '@washi/ui'
import { ThemeSwatch } from '@/components/shared/theme-swatch'
import type { PageMenuPanelProps } from './lib'
import { useWornTheme } from './lib/hooks/use-worn-theme'

const ROW =
  'flex h-9 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-accent'

const HOUSE = THEME_IDS.filter((id) => !THEMES[id].credit)
const PORTED = THEME_IDS.filter((id) => THEMES[id].credit)

/** What the page wears; Washi is no theme at all, so picking it drops the prop. */
export function ThemePanel({ sheet, onDone }: PageMenuPanelProps) {
  const worn = useWornTheme(sheet.id)
  const own = useThemesStore((state) => state.themes)
  const pick = (key: string) => {
    if (key !== worn) {
      void useSheetsStore.getState().updateMeta(sheet.id, { theme: key === 'washi' ? null : key })
    }
    onDone()
  }
  const row = (key: string, pair: ThemePair) => (
    <button
      key={key}
      type="button"
      role="menuitemradio"
      aria-checked={key === worn}
      onClick={() => pick(key)}
      className={ROW}
    >
      <ThemeSwatch pair={pair} className="h-6 w-8 text-[10px]" />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate">{pair.name}</span>
        {pair.credit && (
          <span className="truncate text-[11px] text-muted-foreground">{pair.credit}</span>
        )}
      </span>
      {key === worn && <IconCheck className="size-4 text-primary" />}
    </button>
  )
  const label = 'px-2 pt-2.5 pb-1 font-medium text-[11px] text-muted-foreground'

  return (
    <div role="menu" aria-label="Page theme" className="max-h-[360px] overflow-y-auto p-1">
      {own.length > 0 && <p className={label}>This workspace</p>}
      {own.map((theme) => row(`ws:${theme.slug}`, theme))}
      <p className={label}>Washi</p>
      {HOUSE.map((id) => row(id, THEMES[id]))}
      <p className={label}>Ported</p>
      {PORTED.map((id) => row(id, THEMES[id]))}
      <hr className="my-1 border-border" />
      <Link
        role="menuitem"
        to="/w/$workspaceId/settings"
        from="/w/$workspaceId"
        search={{ tab: 'themes' }}
        onClick={onDone}
        className={`${ROW} text-muted-foreground`}
      >
        <IconSettings className="size-4" />
        Make or import a theme…
      </Link>
    </div>
  )
}
