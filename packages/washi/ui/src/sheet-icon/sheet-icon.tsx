import {
  IconBook,
  IconBookmark,
  IconCalendar,
  IconChartBar,
  IconChecklist,
  IconClock,
  IconCoin,
  IconCompass,
  IconFileText,
  IconFlag,
  IconFlask,
  IconHeart,
  IconHome,
  IconInbox,
  IconLayoutKanban,
  IconLeaf,
  IconMap,
  IconMusic,
  IconNotebook,
  IconPencil,
  IconPlane,
  IconRocket,
  IconSparkles,
  IconStar,
  IconSun,
  IconTag,
  IconTarget,
  IconTool,
  IconUser,
} from '@tabler/icons-react'
import type { ComponentType } from 'react'
import { hostFileUrl } from '../api'
import { isEmoji, type SheetIconProps } from './lib'

const ICONS: Record<string, ComponentType<{ className?: string }>> = {
  notebook: IconNotebook,
  book: IconBook,
  bookmark: IconBookmark,
  calendar: IconCalendar,
  chart: IconChartBar,
  checklist: IconChecklist,
  clock: IconClock,
  compass: IconCompass,
  flag: IconFlag,
  flask: IconFlask,
  heart: IconHeart,
  home: IconHome,
  inbox: IconInbox,
  kanban: IconLayoutKanban,
  leaf: IconLeaf,
  map: IconMap,
  money: IconCoin,
  music: IconMusic,
  pen: IconPencil,
  plane: IconPlane,
  rocket: IconRocket,
  sparkles: IconSparkles,
  star: IconStar,
  sun: IconSun,
  tag: IconTag,
  target: IconTarget,
  tools: IconTool,
  user: IconUser,
}

/**
 * A sheet's `icon` is a registry name, an emoji or an upload (`file:<id>`) a person picked;
 * unknown names, and uploads on a host that stores none, fall back to a page glyph.
 */
export function SheetIcon({ name, className }: SheetIconProps) {
  const upload = name?.startsWith('file:') ? hostFileUrl()?.(name.slice('file:'.length)) : null
  if (upload) {
    return <img src={upload} alt="" className={`rounded-[22%] object-cover ${className ?? ''}`} />
  }
  if (name && isEmoji(name)) {
    return (
      <span
        aria-hidden
        className={`inline-grid place-items-center leading-none ${className ?? ''}`}
      >
        {name}
      </span>
    )
  }
  const Icon = (name && ICONS[name]) || IconFileText
  return <Icon className={className} />
}
