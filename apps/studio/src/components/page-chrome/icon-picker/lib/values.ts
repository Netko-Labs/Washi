import {
  IconBallFootball,
  IconBulb,
  IconFlag,
  IconHandStop,
  IconHash,
  IconMoodSmile,
  IconPaw,
  IconPlane,
  IconToolsKitchen2,
} from '@tabler/icons-react'
import type { EmojiCategoryId } from '@/components/shared/emoji'

export const CATEGORY_ICONS: Record<EmojiCategoryId, typeof IconMoodSmile> = {
  smileys: IconMoodSmile,
  people: IconHandStop,
  nature: IconPaw,
  food: IconToolsKitchen2,
  travel: IconPlane,
  activities: IconBallFootball,
  objects: IconBulb,
  symbols: IconHash,
  flags: IconFlag,
}
