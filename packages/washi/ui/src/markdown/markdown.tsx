import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MARKDOWN_COMPONENTS } from './markdown-components'
import type { MarkdownProps } from './types'

const PLUGINS = [remarkGfm]

/** Agent prose. Raw HTML is never rendered: react-markdown drops it unless asked not to. */
export function Markdown({ text }: MarkdownProps) {
  return (
    <ReactMarkdown remarkPlugins={PLUGINS} components={MARKDOWN_COMPONENTS}>
      {text}
    </ReactMarkdown>
  )
}
