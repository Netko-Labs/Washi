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
import type { Column } from './types'

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
