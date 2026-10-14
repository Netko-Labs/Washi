import { IconLogout, IconMoon, IconSun } from '@tabler/icons-react'
import { initials, useViewStore } from '@washi/ui'
import { signOut } from '@/integrations/auth'
import { useTheme } from './lib'

export function UserRow() {
  const identity = useViewStore((state) => state.identity)
  const { theme, toggle } = useTheme()

  return (
    <div className="flex items-center gap-2 border-border border-t px-3 py-2.5">
      <span
        className="grid size-7 shrink-0 place-items-center rounded-full font-semibold text-[11px]"
        style={{ backgroundColor: identity.color, color: '#fff6e4' }}
      >
        {initials(identity.name)}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-medium text-[12.5px]">{identity.name}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{identity.email}</span>
      </span>
      <button
        type="button"
        onClick={toggle}
        aria-label={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        title={theme === 'dark' ? 'Light theme' : 'Dark theme'}
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
      >
        {theme === 'dark' ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
      </button>
      <button
        type="button"
        onClick={() => void signOut().then(() => window.location.assign('/sign-in'))}
        aria-label="Sign out"
        title="Sign out"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground hover:bg-accent"
      >
        <IconLogout className="size-4" />
      </button>
    </div>
  )
}
