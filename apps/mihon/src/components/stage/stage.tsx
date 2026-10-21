import { WsxView } from '@washi/paper'
import { useMemo } from 'react'
import { useBookStore } from '@/components/shared/book'
import { pageSource } from '@/components/shared/specimen'
import { Source } from '@/components/source'
import { compile } from './lib'

const WIDTH_PX: Record<string, string> = { '320': '320px', '400': '400px', '720': '720px' }

export function Stage() {
  const book = useBookStore()
  const name = book.primitive
  const source = pageSource({
    name,
    knobs: book.knobs,
    childrenText: book.childrenText,
    theme: book.theme,
    feel: book.feel,
    accent: book.accent,
    view: book.view,
    scratch: book.scratch,
  })
  const page = useMemo(() => compile(source), [source])
  const problems = page.diagnostics.filter((d) => d.severity === 'error' || book.view === 'scratch')

  return (
    <main className="grid min-h-0 grid-rows-[minmax(0,1fr)_auto] bg-background">
      <div className="min-h-0 overflow-auto p-6">
        <div
          className="mx-auto rounded-[19px] shadow-[0_1px_0_rgb(0_0_0/0.04),0_12px_40px_rgb(34_31_26/0.08)] transition-[max-width]"
          style={{ maxWidth: WIDTH_PX[book.width] ?? '100%' }}
        >
          {page.root ? (
            <WsxView key={`${name}:${book.view}`} root={page.root} />
          ) : (
            <div className="p-6 text-[13px] text-muted-foreground">
              The page does not parse yet.
            </div>
          )}
        </div>
      </div>
      <div className="border-border border-t">
        {problems.length > 0 && (
          <ul className="max-h-32 overflow-auto border-border border-b px-4 py-2 font-mono text-[12px]">
            {problems.map((d, i) => (
              <li
                key={i}
                className={d.severity === 'error' ? 'text-destructive' : 'text-muted-foreground'}
              >
                {d.severity} · {d.path ?? (d.line ? `line ${d.line}` : 'page')} — {d.message}
              </li>
            ))}
          </ul>
        )}
        <Source source={source} />
      </div>
    </main>
  )
}
