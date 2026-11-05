import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'

/** A link's visitor picks paper, ink or their device's own; the device's is where they start. */
export const SHARED_THEMES = [
  { id: 'light', label: 'Light', icon: IconSun },
  { id: 'dark', label: 'Dark', icon: IconMoon },
  { id: 'system', label: 'Match this device', icon: IconDeviceDesktop },
] as const
