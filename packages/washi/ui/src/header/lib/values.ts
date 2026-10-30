import type { AppView } from '../../stores'

export const STATE_LABELS: Record<string, string> = {
  idle: 'Washi watching',
  reading: 'Washi reading',
  thinking: 'Washi thinking',
  writing: 'Washi writing',
  suggesting: 'Washi suggests',
  done: 'Washi done',
  flagged: 'Washi flagged an issue',
}

export const VIEW_LABELS: Record<Exclude<AppView, 'note'>, string> = {
  dashboard: 'Dashboard',
  inbox: 'Inbox',
  chats: 'Chats',
  routines: 'Routines',
  daily: 'Daily note',
  settings: 'Settings',
  databases: 'Databases',
  trash: 'Trash',
}
