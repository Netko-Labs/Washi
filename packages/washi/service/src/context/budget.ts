import type { BudgetRows, FittedPages, PageCandidate } from './types'
import { CUT_STUB, LEAST_PAGE, LEAST_ROWS } from './values'

/** The most each text may keep so that all of them fit: the same cap for every long one. */
export function waterLevel(lengths: number[], budget: number): number {
  const sorted = [...lengths].sort((a, b) => a - b)
  let left = budget
  for (let index = 0; index < sorted.length; index++) {
    const share = Math.floor(left / (sorted.length - index))
    const length = sorted[index] ?? 0
    if (length > share) return Math.max(0, share)
    left -= length
  }
  return Number.POSITIVE_INFINITY
}

/** Text cut at a line (or a word) near `chars`, never mid-word when it can help it. */
export function cutAt(text: string, chars: number): string {
  if (text.length <= chars) return text
  const head = text.slice(0, Math.max(0, chars))
  const line = head.lastIndexOf('\n')
  const space = head.lastIndexOf(' ')
  const at = line > chars * 0.6 ? line : space > chars * 0.6 ? space : chars
  return head.slice(0, at).trimEnd()
}

/** Lines kept while they fit, then one line saying how many more and where they are. */
export function cutLines(lines: string[], chars: number, more: (count: number) => string): string {
  const kept: string[] = []
  let used = 0
  for (const [index, line] of lines.entries()) {
    const tail = index < lines.length - 1 ? more(lines.length - index - 1).length + 1 : 0
    if (used + line.length + 1 + tail > chars) {
      return [...kept, more(lines.length - index)].join('\n')
    }
    kept.push(line)
    used += line.length + 1
  }
  return kept.join('\n')
}

/** A table's rows cut to whole lines: its header kept, then as many rows as fit. */
export function cutRows(text: string, chars: number): { text: string; dropped: number } {
  if (text.length <= chars) return { text, dropped: 0 }
  const lines = text.split('\n')
  const head = lines.findIndex((line) => line.startsWith('Each row:'))
  const kept = lines.slice(0, head + 1)
  let used = kept.join('\n').length
  let index = head + 1
  for (; index < lines.length; index++) {
    const line = lines[index] ?? ''
    if (used + line.length + 1 > chars) break
    kept.push(line)
    used += line.length + 1
  }
  const dropped = lines.slice(index).filter((line) => line.startsWith('- ')).length
  return { text: kept.join('\n'), dropped }
}

/**
 * Tables' rows within `chars`, in table order: each takes what it needs while there is room, the
 * one that meets the end is cut to whole lines (a line says how many more and the call that reads
 * them), and the tables after it show none — named once, for the Left out list.
 */
export function fitRows(
  rows: BudgetRows[],
  chars: number,
): { texts: Map<string, string>; cut: string[] } {
  const texts = new Map<string, string>()
  const skipped: string[] = []
  const shortened: string[] = []
  let left = chars
  for (const each of rows) {
    if (left < LEAST_ROWS) {
      skipped.push(`\`${each.name}\``)
      continue
    }
    const tail = each.fetch.length + 20
    const fits = each.text.length <= left && each.unshown === 0
    const { text, dropped } = fits
      ? { text: each.text, dropped: 0 }
      : cutRows(each.text, Math.max(0, left - tail))
    const more = dropped + each.unshown
    const said = more > 0 ? `${text}\n… ${more} more — ${each.fetch}` : text
    if (more > 0) shortened.push(`\`${each.name}\``)
    texts.set(each.name, said)
    left -= said.length + 2
  }
  const cut = [
    ...(shortened.length
      ? [`more open rows of ${shortened.join(', ')} — each table's last line says the call`]
      : []),
    ...(skipped.length
      ? [`the open rows of ${skipped.join(', ')} — db_query each with its status filter`]
      : []),
  ]
  return { texts, cut }
}

/**
 * The pages that fit in `chars`, in tree order: each takes its heading and at least a little of its
 * words (all of a short page); past what fits, the rest are not read at all — their sources never
 * parsed — and are counted. Then the words share what is left evenly: a short page whole, every
 * long one cut at the same length with a stub.
 */
export function fitPages(pages: PageCandidate[], chars: number): FittedPages {
  const bodies: string[] = []
  let used = 0
  for (const page of pages) {
    const head = page.head.length + 2
    if (used + head + Math.min(LEAST_PAGE, 40) > chars) break
    const body = page.body()
    const least = Math.min(body.length, LEAST_PAGE)
    if (used + head + least + 2 > chars) break
    bodies.push(body)
    used += head + least + 2
  }
  const kept = pages.slice(0, bodies.length)
  const heads = kept.reduce((sum, page) => sum + page.head.length + 4, 0)
  const level = waterLevel(
    bodies.map((body) => body.length),
    chars - heads - kept.length * CUT_STUB.length,
  )
  const cut: string[] = []
  const sections = kept.map((page, index) => {
    const body = bodies[index] ?? ''
    if (body.length <= level) return `${page.head}\n\n${body}`
    cut.push(page.title)
    return `${page.head}\n\n${cutAt(body, level)}${CUT_STUB}`
  })
  return { sections, cut, dropped: pages.length - kept.length }
}
