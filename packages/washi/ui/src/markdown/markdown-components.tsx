import type { Components } from 'react-markdown'

/** Agent replies speak in the app's voice: Karla body, serif headings, paper code. */
export const MARKDOWN_COMPONENTS: Components = {
  h1: ({ children }) => (
    <h3 className="mt-3 mb-1 font-serif text-[17px] leading-snug">{children}</h3>
  ),
  h2: ({ children }) => (
    <h3 className="mt-3 mb-1 font-serif text-[16px] leading-snug">{children}</h3>
  ),
  h3: ({ children }) => <h4 className="mt-2.5 mb-1 font-semibold text-[14px]">{children}</h4>,
  p: ({ children }) => <p className="my-1.5">{children}</p>,
  ul: ({ children }) => <ul className="my-1.5 list-disc space-y-0.5 pl-5">{children}</ul>,
  ol: ({ children }) => <ol className="my-1.5 list-decimal space-y-0.5 pl-5">{children}</ol>,
  li: ({ children }) => <li className="pl-0.5 marker:text-muted-foreground">{children}</li>,
  a: ({ children, href }) => (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="text-primary underline decoration-primary/40 underline-offset-2 hover:decoration-primary"
    >
      {children}
    </a>
  ),
  strong: ({ children }) => <strong className="font-semibold">{children}</strong>,
  blockquote: ({ children }) => (
    <blockquote className="my-2 border-border border-l-2 pl-3 text-muted-foreground">
      {children}
    </blockquote>
  ),
  code: ({ children, className }) =>
    className ? (
      <code className={className}>{children}</code>
    ) : (
      <code className="rounded bg-muted px-1 py-px font-mono text-[12px]">{children}</code>
    ),
  pre: ({ children }) => (
    <pre className="my-2 overflow-x-auto rounded-lg bg-muted p-3 font-mono text-[12px] leading-relaxed">
      {children}
    </pre>
  ),
  table: ({ children }) => (
    <div className="my-2 overflow-x-auto">
      <table className="w-full border-collapse text-[12.5px]">{children}</table>
    </div>
  ),
  th: ({ children }) => (
    <th className="border-border border-b px-2 py-1 text-left font-semibold">{children}</th>
  ),
  td: ({ children }) => <td className="border-border/60 border-b px-2 py-1">{children}</td>,
  hr: () => <hr className="my-3 border-border" />,
}
