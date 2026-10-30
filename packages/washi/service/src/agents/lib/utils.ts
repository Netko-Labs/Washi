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
