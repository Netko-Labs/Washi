import { serialize } from '@washi/wsx'
import type { Root, RootContent } from 'mdast'
import { fromMarkdown } from 'mdast-util-from-markdown'
import { gfmFromMarkdown } from 'mdast-util-gfm'
import { gfm } from 'micromark-extension-gfm'
import { blockOf, el } from './blocks'
import { plainOf } from './inline'
import type { Converting, MarkdownOptions, MarkdownPage } from './types'
import { DEFAULT_TITLE, MAX_MARKDOWN_CHARS, TITLE_CHARS } from './values'

/** Every `[label]: url` the document defines, by the label references name. */
function definitionsOf(tree: Root): Map<string, string> {
  const found = new Map<string, string>()
  const visit = (nodes: RootContent[]) => {
    for (const node of nodes) {
      if (node.type === 'definition') found.set(node.identifier.toLowerCase(), node.url)
      if ('children' in node) visit(node.children as RootContent[])
    }
  }
  visit(tree.children)
  return found
}

const sameWords = (a: string, b: string) =>
  a.trim().replace(/\s+/g, ' ').toLowerCase() === b.trim().replace(/\s+/g, ' ').toLowerCase()

/**
 * A Markdown document (CommonMark + GitHub's tables, task lists, strikethrough and alerts) as a
 * page: headings Titles, paragraphs Texts, lists Lists of Items (checked boxes done), fenced code
 * Code, pipe tables written Tables, quotes Quotes or Callouts, a lone https picture a Figure, and
 * inline marks kept as paper reads them. Whatever a page cannot draw is listed in `kept`: block
 * HTML and footnotes stay byte for byte in a Code block, HTML inside a line as visible words.
 * Braces, angle brackets, quotes and backslashes are escaped by
 * `serialize`, so any text round-trips.
 */
export function markdownToPage(markdown: string, options: MarkdownOptions = {}): MarkdownPage {
  if (markdown.length > MAX_MARKDOWN_CHARS) {
    throw new Error(
      `that Markdown is ${markdown.length} characters; one import takes ${MAX_MARKDOWN_CHARS} — split it into pages`,
    )
  }
  const tree = fromMarkdown(markdown.replace(/^﻿/, ''), {
    extensions: [gfm()],
    mdastExtensions: [gfmFromMarkdown()],
  })
  const context: Converting = { markdown, definitions: definitionsOf(tree), kept: [] }
  const [first, ...rest] = tree.children
  const heading = first?.type === 'heading' && first.depth === 1 ? plainOf(first).trim() : ''
  const title = (options.title?.trim() || heading || DEFAULT_TITLE).slice(0, TITLE_CHARS)
  // The page's title is drawn by its frame: a leading `# Title` saying the same would be twice.
  const body = heading && sameWords(heading, title) ? rest : tree.children
  const root = el(
    'Sheet',
    { title },
    body.flatMap((node) => blockOf(node, context)),
  )
  return { title, source: serialize(root), root, kept: context.kept }
}
