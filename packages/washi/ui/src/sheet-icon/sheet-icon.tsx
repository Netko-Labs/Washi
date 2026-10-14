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
 * A sheet's `icon` is a registry name or an emoji a person picked; unknown names fall back to a
 * page glyph.
 */
export function SheetIcon({ name, className }: SheetIconProps) {
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
