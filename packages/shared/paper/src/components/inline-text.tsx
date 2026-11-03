import type { ReactNode } from 'react'
import { inlineMarks, resolveRow } from '../lib'
import type { InlineToken, Row } from '../lib/types'

function drawn(tokens: InlineToken[], words: (text: string) => string): ReactNode[] {
  return tokens.map((token, index) => {
    switch (token.kind) {
      case 'text':
        return words(token.text)
      case 'code':
        return (
          <code key={index} className="wsx-inline-code">
            {words(token.text)}
          </code>
        )
      case 'strong':
        return <strong key={index}>{drawn(token.children, words)}</strong>
      case 'em':
        return <em key={index}>{drawn(token.children, words)}</em>
      case 'strike':
        return <s key={index}>{drawn(token.children, words)}</s>
      default:
        // A link: the one mark left.
        return (
          <a
            key={index}
            className="wsx-link"
            href={token.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
          >
            {drawn(token.children, words)}
          </a>
        )
    }
  })
}

/**
 * A text run with its inline marks drawn. The marks are read off what the page wrote, before any
 * `$row.` is filled, so a row's own words never turn into marks.
 */
export function inlineText(
  text: string,
  row: Row | undefined,
  shown: (cell: unknown) => string,
): ReactNode {
  const tokens = inlineMarks(text)
  const words = (words: string) => resolveRow(words, row, shown)
  if (tokens.length === 1 && tokens[0]?.kind === 'text') return words(text)
  return drawn(tokens, words)
}
