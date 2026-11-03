import type { InlineToken } from './types'

/** Characters that may start a mark; text without any of them is one plain run. */
const MARK_START = /[*_`[~\\]/
const ESCAPABLE = new Set(['*', '_', '`', '[', ']', '(', ')', '~', '\\'])
/** Where a written link may go: the web over https, or an address to write to. */
const LINK_HREF = /^(https:\/\/|mailto:)[^\s()<>]+$/
const WORD = /[\p{L}\p{N}]/u

const isSpace = (char: string | undefined) => char === undefined || /\s/.test(char)
const isWord = (char: string | undefined) => char !== undefined && WORD.test(char)

/** The closing run of `mark` for an opening at `from`, flanking as CommonMark has it; -1 if none. */
function closingOf(text: string, mark: string, from: number): number {
  const single = mark.length === 1
  for (let at = from; at < text.length; at++) {
    const char = text[at]
    if (char === '\\') {
      at++
      continue
    }
    if (char === '`') {
      // A code span's text is its own: a mark inside it closes nothing.
      const end = text.indexOf('`', at + 1)
      if (end !== -1) at = end
      continue
    }
    if (!text.startsWith(mark, at)) continue
    // `*a **b** c*`: a double run inside a single mark is that double's, not this one's.
    if (single && text[at + 1] === mark) {
      at++
      continue
    }
    if (at === from || isSpace(text[at - 1])) continue
    if (mark[0] === '_' && isWord(text[at + mark.length])) continue
    return at
  }
  return -1
}

function opens(text: string, at: number, mark: string): boolean {
  if (isSpace(text[at + mark.length])) return false
  return !(mark[0] === '_' && isWord(text[at - 1]))
}

/** `[label](https://…)` at `at`: the label, the address and where it ends; null when it is not one. */
function linkAt(text: string, at: number): { label: string; href: string; end: number } | null {
  const close = text.indexOf('](', at + 1)
  if (close === -1) return null
  const label = text.slice(at + 1, close)
  if (label.length === 0 || label.includes('[') || label.includes(']')) return null
  const end = text.indexOf(')', close + 2)
  if (end === -1) return null
  const href = text.slice(close + 2, end).trim()
  return LINK_HREF.test(href) ? { label, href, end: end + 1 } : null
}

const MARKS: { mark: string; kind: 'strong' | 'em' | 'strike' }[] = [
  { mark: '**', kind: 'strong' },
  { mark: '__', kind: 'strong' },
  { mark: '~~', kind: 'strike' },
  { mark: '*', kind: 'em' },
  { mark: '_', kind: 'em' },
]

/**
 * A text run's inline marks, as a page's markdown writes them: **strong**, *em* or _em_, ~~strike~~,
 * `code` and [a link](https://…). Anything that does not close stays the characters it was, so
 * `2 * 3 * 4` and snake_case_names read as typed; a backslash keeps the next mark literal.
 */
export function inlineMarks(text: string): InlineToken[] {
  if (!MARK_START.test(text)) return text ? [{ kind: 'text', text }] : []
  const out: InlineToken[] = []
  let plain = ''
  const flush = () => {
    if (plain) out.push({ kind: 'text', text: plain })
    plain = ''
  }
  let at = 0
  while (at < text.length) {
    const char = text[at] ?? ''
    if (char === '\\' && ESCAPABLE.has(text[at + 1] ?? '')) {
      plain += text[at + 1]
      at += 2
      continue
    }
    if (char === '`') {
      let run = 1
      while (text[at + run] === '`') run++
      const fence = '`'.repeat(run)
      const end = text.indexOf(fence, at + run)
      if (end !== -1 && text[end + run] !== '`') {
        const inner = text.slice(at + run, end)
        const trimmed =
          inner.length > 2 && inner.startsWith(' ') && inner.endsWith(' ')
            ? inner.slice(1, -1)
            : inner
        flush()
        out.push({ kind: 'code', text: trimmed })
        at = end + run
        continue
      }
      plain += fence
      at += run
      continue
    }
    if (char === '[') {
      const link = linkAt(text, at)
      if (link) {
        flush()
        out.push({ kind: 'link', href: link.href, children: inlineMarks(link.label) })
        at = link.end
        continue
      }
    }
    const found = MARKS.find(({ mark }) => text.startsWith(mark, at) && opens(text, at, mark))
    if (found) {
      const close = closingOf(text, found.mark, at + found.mark.length)
      if (close !== -1) {
        flush()
        const inner = text.slice(at + found.mark.length, close)
        out.push({ kind: found.kind, children: inlineMarks(inner) })
        at = close + found.mark.length
        continue
      }
    }
    plain += char
    at++
  }
  flush()
  return out
}

/** The words a reader sees, the marks gone — what a preview or a search reads. */
export function inlinePlain(tokens: InlineToken[]): string {
  return tokens
    .map((token) => ('children' in token ? inlinePlain(token.children) : token.text))
    .join('')
}
