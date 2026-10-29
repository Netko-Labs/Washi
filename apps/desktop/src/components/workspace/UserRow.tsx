import {
  IconKey,
  IconLogout,
  IconMoon,
  IconSelector,
  IconSettings,
  IconSun,
  IconUser,
} from '@tabler/icons-react'
import { initials, useViewStore } from '@washi/ui'
import { useState } from 'react'
import { useShallow } from 'zustand/react/shallow'

const MENU_ROW =
  'flex h-[30px] w-full items-center gap-[9px] rounded-lg px-2 text-left text-[12.5px] hover:bg-accent'

export function UserRow() {
  const [open, setOpen] = useState(false)
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const { openTab, identity } = useViewStore(
    useShallow((state) => ({ openTab: state.openTab, identity: state.identity })),
  )

  const setTheme = (next: boolean) => {
    document.documentElement.classList.toggle('dark', next)
    setDark(next)
  }
  const ThemeIcon = dark ? IconMoon : IconSun

  return (
    <div className="relative flex items-center gap-[9px] border-border border-t px-3 py-2.5">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="-m-1 flex min-w-0 flex-1 items-center gap-[9px] rounded-[9px] p-1 text-left hover:bg-accent"
      >
        <span className="relative flex flex-none">
          <span
            className="flex size-7 items-center justify-center rounded-full font-semibold text-[11px]"
            style={{ backgroundColor: identity.color, color: '#fff6e4' }}
          >
            {initials(identity.name)}
          </span>
          <span className="-right-px -bottom-px absolute size-[9px] rounded-full border-2 border-muted bg-muted-foreground" />
        </span>
        <span className="min-w-0">
          <span className="block truncate font-medium text-[12.5px]">{identity.name}</span>
          <span className="block truncate text-[11px] text-muted-foreground">Local account</span>
        </span>
        <span className="ml-auto flex flex-none opacity-50">
          <IconSelector className="size-[13px]" />
        </span>
      </button>

      {open && (
        <div className="absolute bottom-[52px] left-2.5 z-[70] w-[224px] rounded-xl border border-border bg-popover p-[5px] shadow-[0_8px_28px_rgba(0,0,0,0.16)]">
          <div className="flex items-center gap-[9px] p-2">
            <span
              className="flex size-7 flex-none items-center justify-center rounded-full font-semibold text-[11px]"
              style={{ backgroundColor: identity.color, color: '#fff6e4' }}
            >
              {initials(identity.name)}
            </span>
            <span className="min-w-0">
              <span className="block font-medium text-[12.5px]">{identity.name}</span>
              <span className="block text-[11px] text-muted-foreground">mira@hollowmoor.net</span>
            </span>
          </div>
          <div className="mx-1 mt-0.5 mb-1 h-px bg-border" />
          <div className="flex h-[34px] items-center gap-[9px] px-2 text-[12.5px]">
            <ThemeIcon className="size-3.5" />
            <span className="flex-1">Theme</span>
            <span className="flex overflow-hidden rounded-lg border border-border">
              <button
                type="button"
                onClick={() => setTheme(false)}
                className={`h-6 px-[9px] text-[11.5px] ${
                  dark
                    ? 'bg-background text-muted-foreground'
                    : 'bg-primary text-primary-foreground'
                }`}
              >
                Light
              </button>
              <button
                type="button"
                onClick={() => setTheme(true)}
                className={`h-6 border-border border-l px-[9px] text-[11.5px] ${
                  dark
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-background text-muted-foreground'
                }`}
              >
                Dark
              </button>
            </span>
          </div>
          <div className="mx-1 my-1 h-px bg-border" />
          <button type="button" className={MENU_ROW}>
            <IconUser className="size-3.5" />
            Profile
          </button>
          <button type="button" className={MENU_ROW}>
            <IconKey className="size-3.5" />
            Devices & keys
          </button>
          <button
            type="button"
            onClick={() => {
              openTab('view:settings')
              setOpen(false)
            }}
            className={MENU_ROW}
          >
            <IconSettings className="size-3.5" />
            Settings
          </button>
          <div className="mx-1 my-1 h-px bg-border" />
          <button
            type="button"
            onClick={() => setOpen(false)}
            className={`${MENU_ROW} text-muted-foreground`}
          >
            <IconLogout className="size-3.5" />
            Lock vault
          </button>
        </div>
      )}
    </div>
  )
}
