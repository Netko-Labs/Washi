import { IconInbox, IconLayoutDashboard, IconSettings } from '@tabler/icons-react'
import type { NavEntry } from './types'

export const NAV: NavEntry[] = [
  { tab: 'view:dashboard', label: 'Dashboard', icon: IconLayoutDashboard },
  { tab: 'view:inbox', label: 'Inbox', icon: IconInbox },
  { tab: 'view:settings', label: 'Settings', icon: IconSettings },
]
