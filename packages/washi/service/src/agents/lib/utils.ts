import { TITLE_WORDS } from './constants'

/** The first words of an ask, as a title — until Washi names the conversation. */
export function titleFrom(text: string): string {
  const words = text.trim().split(/\s+/).filter(Boolean)
  const head = words.slice(0, TITLE_WORDS).join(' ')
  return (words.length > TITLE_WORDS ? `${head}…` : head) || 'New conversation'
}
