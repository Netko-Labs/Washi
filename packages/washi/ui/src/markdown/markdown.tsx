import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { MARKDOWN_COMPONENTS } from './lib/values'

const PLUGINS = [remarkGfm]

/** Agent prose. Raw HTML is never rendered: react-markdown drops it unless asked not to. */
export function Markdown({ text }: { text: string }) {
  return (
    <ReactMarkdown remarkPlugins={PLUGINS} components={MARKDOWN_COMPONENTS}>
      {text}
    </ReactMarkdown>
  )
}
