import {
  IconArrowUpRight,
  IconCalendar,
  IconCircleChevronDown,
  IconHash,
  IconLetterT,
  IconLink,
  IconProgress,
  IconSquareCheck,
  IconTags,
  IconUser,
} from '@tabler/icons-react'
import type { Column, StatusGroup } from './types'

export const PROPERTY_ICONS: Record<Column['type'], typeof IconHash> = {
  text: IconLetterT,
  number: IconHash,
  boolean: IconSquareCheck,
  date: IconCalendar,
  select: IconCircleChevronDown,
  status: IconProgress,
  multi_select: IconTags,
  person: IconUser,
  url: IconLink,
  relation: IconArrowUpRight,
}

export const STATUS_CHIP: Record<StatusGroup, string> = {
  todo: 'bg-muted text-muted-foreground',
  doing: 'bg-[#2563eb]/10 text-[#2563eb]',
  done: 'bg-[#16a34a]/10 text-[#16a34a]',
}

export const CHIP = 'inline-flex h-[22px] items-center rounded-md px-1.5 text-[12.5px]'
