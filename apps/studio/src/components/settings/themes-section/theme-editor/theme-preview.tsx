import { PaperProvider, SheetLookProvider, WsxView } from '@washi/paper'
import { createBookHost } from '@washi/paper/book'
import { parse } from '@washi/wsx'
import { PREVIEW_SOURCE, type ThemePreviewProps } from '../lib'

const ROOT = parse(PREVIEW_SOURCE)
// The sample binds nothing; the book's in-memory host only satisfies the provider.
const HOST = createBookHost(() => {})

/** The draft as a page wears it, in the mode being edited whatever the reader's own. */
export function ThemePreview({ tokens }: ThemePreviewProps) {
  const pair = { name: 'Preview', light: tokens, dark: tokens }
  return (
    <div className="pointer-events-none h-full overflow-hidden rounded-xl border border-border [&_.wsx]:min-h-full">
      <SheetLookProvider value={{ theme: () => pair }}>
        <PaperProvider host={HOST}>
          <WsxView root={ROOT} />
        </PaperProvider>
      </SheetLookProvider>
    </div>
  )
}
