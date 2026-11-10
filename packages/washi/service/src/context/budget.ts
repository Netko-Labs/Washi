import type { BudgetPage, BudgetRows, Fitted } from './types'

/** The most each page may keep so that all of them fit: the same cap for every long one. */
function waterLevel(lengths: number[], budget: number): number {
  const sorted = [...lengths].sort((a, b) => a - b)
  let left = budget
  for (let index = 0; index < sorted.length; index++) {
    const share = Math.floor(left / (sorted.length - index))
    const length = sorted[index] ?? 0
    if (length > share) return share
    left -= length
  }
  return Number.POSITIVE_INFINITY
}

/** Text cut at a line (or a word) near `chars`, never mid-word when it can help it. */
export function cutAt(text: string, chars: number): string {
  if (text.length <= chars) return text
  const head = text.slice(0, chars)
  const line = head.lastIndexOf('\n')
  const space = head.lastIndexOf(' ')
  const at = line > chars * 0.6 ? line : space > chars * 0.6 ? space : chars
  return head.slice(0, at).trimEnd()
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

/** Least words a page keeps before it is dropped to its heading alone. */
const LEAST_PAGE = 300

/**
 * What fits in the budget: rows take up to their cap first, the pages share the rest evenly (a
 * short page whole, every long one cut at the same length); when even that is too little, the last
 * pages in the tree keep only their heading. Everything cut or dropped is named for fetching.
 */
export function fit(
  pages: BudgetPage[],
  rows: BudgetRows[],
  budget: number,
  rowsCap: number,
): Fitted {
  const leftOut: string[] = []
  let rowsLeft = Math.max(0, Math.min(budget, rowsCap))
  const rowsTotal = rows.reduce((sum, each) => sum + each.text.length, 0)
  const fittedRows = rows.map((each) => {
    const share =
      rowsTotal <= rowsLeft
        ? each.text.length
        : Math.floor((rowsLeft * each.text.length) / Math.max(1, rowsTotal))
    const { text, dropped } = cutRows(each.text, share)
    if (dropped > 0) leftOut.push(`${dropped} more rows of \`${each.name}\` — ${each.fetch}`)
    return {
      name: each.name,
      text: dropped > 0 ? `${text}\n\n… ${dropped} more rows — ${each.fetch}` : text,
    }
  })
  rowsLeft = budget - fittedRows.reduce((sum, each) => sum + each.text.length, 0)
  const bodies = pages.map((page) => page.body.length)
  let kept = pages.length
  let level = waterLevel(bodies, rowsLeft)
  while (level < LEAST_PAGE && kept > 0) {
    kept -= 1
    level = waterLevel(bodies.slice(0, kept), rowsLeft)
  }
  const fittedPages = pages.map((page, index) => {
    const fetch = `sheet_get { "id": "${page.id}" }`
    if (index >= kept) {
      leftOut.push(`"${page.title}" — ${fetch}`)
      return { id: page.id, body: `*Left out for length — ${fetch}*` }
    }
    if (page.body.length <= level) return { id: page.id, body: page.body }
    leftOut.push(`the rest of "${page.title}" — ${fetch}`)
    return {
      id: page.id,
      body: `${cutAt(page.body, level)} …\n\n*Cut for length — ${fetch} for the rest.*`,
    }
  })
  return { pages: fittedPages, rows: fittedRows, leftOut }
}
