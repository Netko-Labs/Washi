import { IconBook, IconChefHat, IconMap2, IconTargetArrow } from '@tabler/icons-react'

/** Said the way a person would ask — no tables, columns or components. */
export const STARTERS = [
  {
    icon: IconBook,
    title: 'A reading list',
    prompt: 'Make me a reading list I can sort by what I want to read, am reading, and finished.',
  },
  {
    icon: IconMap2,
    title: 'Plan a trip',
    prompt: 'Help me plan a trip: the places I want to see, a rough budget, and a day-by-day plan.',
  },
  {
    icon: IconTargetArrow,
    title: "My team's goals",
    prompt:
      "Make a page to track my team's goals this quarter, who owns each, and how far along it is.",
  },
  {
    icon: IconChefHat,
    title: 'A recipe box',
    prompt:
      'Start a recipe box where I can keep recipes, their ingredients, and how much I liked them.',
  },
] as const
