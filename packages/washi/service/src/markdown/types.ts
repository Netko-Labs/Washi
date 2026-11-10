import type { WsxElement } from '@washi/wsx'

/** A Markdown document as a page: its WSX, the tree it was written from, and what stayed as Code. */
export interface MarkdownPage {
  title: string
  source: string
  root: WsxElement
  /** Each part kept byte for byte in a `<Code>` block because nothing on a page draws it. */
  kept: string[]
}

export interface MarkdownOptions {
  /** The page's title; without one, the document's leading `# heading`, else a plain default. */
  title?: string
}

/** What converting one document carries along: its text, its link definitions, what it kept. */
export interface Converting {
  markdown: string
  /** `[label]: https://…` definitions, by their normalized label, for reference links. */
  definitions: Map<string, string>
  kept: string[]
}

/** A GitHub alert (`> [!NOTE]`) as a Callout wears it. */
export interface AlertLook {
  tone: 'info' | 'success' | 'warning' | 'danger'
  title: string
}
