import { IconLogout, IconMoon, IconSettings, IconSun } from '@tabler/icons-react'
import { Link } from '@tanstack/react-router'
import { initials, useViewStore } from '@washi/ui'
import { signOut } from '@/integrations/auth'
import { useTheme } from '../lib'
import { type UserMenuProps, useMenuState } from './lib'

const ROW =
  'flex h-8 w-full items-center gap-2.5 rounded-lg px-2 text-left text-[13px] hover:bg-accent'

/** The person is their avatar; theme, settings and sign out live under it. */
export function UserMenu({ workspace, onNavigate, placement = 'up' }: UserMenuProps) {
  const identity = useViewStore((state) => state.identity)
  const { theme, toggle } = useTheme()
  const menu = useMenuState()

  return (
    <div ref={menu.root} className="relative">
      <button
        type="button"
        onClick={menu.toggle}
        aria-haspopup="menu"
        aria-expanded={menu.isOpen}
        aria-label={identity.name || 'You'}
        title={identity.name}
        className={`grid size-7 place-items-center rounded-full font-semibold text-[11px] ring-offset-2 ring-offset-muted md:size-[22px] md:text-[9.5px] ${menu.isOpen ? 'ring-2 ring-primary' : ''}`}
        style={{ backgroundColor: identity.color, color: '#fff6e4' }}
      >
        {initials(identity.name)}
      </button>
      {menu.isOpen && (
        <div
          role="menu"
          className={`absolute right-0 z-50 w-[200px] ${placement === 'up' ? 'bottom-full mb-2' : 'top-full mt-2'} rounded-xl border border-border bg-popover p-1.5 text-popover-foreground shadow-[0_16px_48px_rgb(0_0_0/0.18)]`}
        >
          <div className="mb-1 border-border border-b px-2 pt-1 pb-2">
            <div className="truncate font-semibold text-[13px]">{identity.name}</div>
            <div className="truncate text-[11px] text-muted-foreground">{identity.email}</div>
          </div>
          <button type="button" role="menuitem" onClick={toggle} className={ROW}>
            {theme === 'dark' ? <IconSun className="size-4" /> : <IconMoon className="size-4" />}
            {theme === 'dark' ? 'Light theme' : 'Dark theme'}
          </button>
          <Link
            to="/w/$workspaceId/settings"
            params={{ workspaceId: workspace.id }}
            search={{ tab: 'agent' }}
            role="menuitem"
            onClick={() => {
              menu.close()
              onNavigate()
            }}
            className={ROW}
          >
            <IconSettings className="size-4" />
            Settings
            <kbd className="ml-auto font-sans text-[10.5px] text-muted-foreground">⌘,</kbd>
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={() => void signOut().then(() => window.location.assign('/sign-in'))}
            className={ROW}
          >
            <IconLogout className="size-4" />
            Sign out
          </button>
        </div>
      )}
    </div>
  )
}
