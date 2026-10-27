import { IconClock, IconHome, IconInbox, IconMessages } from '@tabler/icons-react'
import type { PlaceEntry } from './types'

export const LABEL = 'px-2 pt-4 pb-1 text-[12px] text-muted-foreground md:pt-3 md:text-[11px]'
export const ROW =
  'flex h-12 w-full items-center gap-2 rounded-lg px-2 text-[15px] text-muted-foreground hover:bg-accent md:h-[28px] md:text-[13px]'
export const ROW_ON = 'bg-accent font-medium text-foreground'

export const PLACES: PlaceEntry[] = [
  { id: 'home', label: 'Home', title: 'Home', icon: IconHome },
  { id: 'inbox', label: 'Inbox', title: 'Inbox', icon: IconInbox },
  {
    id: 'chats',
    label: 'Chats',
    title: 'Chats — your conversations with Washi',
    icon: IconMessages,
  },
  { id: 'routines', label: 'Routines', title: 'Routines', icon: IconClock },
]
