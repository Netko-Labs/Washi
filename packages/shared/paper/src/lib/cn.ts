import { twMerge } from 'tailwind-merge'

/**
 * The sheet always wins. Naive concatenation left conflicting utilities on the
 * element and let Tailwind's stylesheet order pick — which is why `class` used
 * to read as a suggestion (spec §10 L3). twMerge keeps exactly one utility per
 * property, and the last argument is the sheet's.
 */
export function cn(...classes: (string | undefined | null | false)[]): string {
  return twMerge(classes.filter(Boolean).join(' '))
}
