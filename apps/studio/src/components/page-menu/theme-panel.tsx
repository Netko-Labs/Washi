import { IconCheck } from '@tabler/icons-react'
import { THEME_IDS, THEMES, type ThemeId } from '@washi/paper/registry'
import { useSheetsStore } from '@washi/ui'
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
  const pick = (id: ThemeId) => {
    if (id !== worn) {
      void useSheetsStore.getState().updateMeta(sheet.id, { theme: id === 'washi' ? null : id })
    }
    onDone()
  }
  const row = (id: ThemeId) => (
    <button
      key={id}
      type="button"
      role="menuitemradio"
      aria-checked={id === worn}
      onClick={() => pick(id)}
      className={ROW}
    >
      <ThemeSwatch pair={THEMES[id]} className="h-6 w-8 text-[10px]" />
      <span className="flex min-w-0 flex-1 flex-col leading-tight">
        <span className="truncate">{THEMES[id].name}</span>
        {THEMES[id].credit && (
          <span className="truncate text-[11px] text-muted-foreground">{THEMES[id].credit}</span>
        )}
      </span>
      {id === worn && <IconCheck className="size-4 text-primary" />}
    </button>
  )

  return (
    <div role="menu" aria-label="Page theme" className="max-h-[360px] overflow-y-auto p-1">
      <p className="px-2 pt-1.5 pb-1 font-medium text-[11px] text-muted-foreground">Washi</p>
      {HOUSE.map(row)}
      <p className="px-2 pt-2.5 pb-1 font-medium text-[11px] text-muted-foreground">Ported</p>
      {PORTED.map(row)}
    </div>
  )
}
