import { TITLE_WORDS } from './constants'

/** The first words of an ask, as a title — until Washi names the conversation. */
export function titleFrom(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const head = words.slice(0, TITLE_WORDS).join(' ')
  return (words.length > TITLE_WORDS ? `${head}…` : head) || 'New conversation'
}

/** What went wrong, in its own words: never `Error: …` or an object dump. */
export function wordsOf(error: unknown): string {
  const words = error instanceof Error ? error.message : String(error)
  return words.trim() || 'the turn failed'
}

/** A reply's first line as plain words: no heading, list or quote marks, emphasis or code ticks. */
export function plainLine(markdown: string, max: number): string | null {
  const line = markdown
    .split('\n')
    .map((each) => each.trim())
    .find((each) => each && !each.startsWith('```'))
  if (!line) return null
  const plain = line
    .replace(/^(#{1,6}\s+|>\s*|[-*+]\s+|\d+[.)]\s+)+/, '')
    .replace(/!?\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/(\*\*|__|~~|`)/g, '')
    .replace(/(^|\W)[*_]([^*_]+)[*_](?=\W|$)/g, '$1$2')
    .trim()
  if (!plain) return null
  return plain.length > max ? `${plain.slice(0, max - 1).trimEnd()}…` : plain
}
