import { IconDeviceDesktop, IconMoon, IconSun } from '@tabler/icons-react'

export const THEME_CHOICES = [
  { id: 'light', label: 'Light', icon: IconSun },
  { id: 'dark', label: 'Dark', icon: IconMoon },
  { id: 'system', label: 'System', icon: IconDeviceDesktop },
] as const
