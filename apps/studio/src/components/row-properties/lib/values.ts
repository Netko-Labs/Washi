import {
  IconArrowUpRight,
  IconCalendar,
  IconCircleChevronDown,
  IconHash,
  IconLetterT,
  IconLink,
  IconMathFunction,
  IconProgress,
  IconSquareCheck,
  IconSum,
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
  formula: IconMathFunction,
  rollup: IconSum,
}
