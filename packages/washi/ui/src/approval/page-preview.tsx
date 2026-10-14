import { PaperProvider, WsxView } from '@washi/paper'
import { parse } from '@washi/wsx'
import { useMemo } from 'react'
import { paperHost } from '../paper-host'
import type { PagePreviewProps } from './lib'

/** The page as it will look — inert, so a button in a draft can never run before it is allowed. */
export function PagePreview({ source }: PagePreviewProps) {
  const root = useMemo(() => {
    try {
      return parse(source)
    } catch {
      return null
    }
  }, [source])
  if (!root) return null

  return (
    <div
      inert
      className="relative max-h-60 overflow-hidden rounded-lg border border-border bg-background"
    >
      <div className="pointer-events-none origin-top-left scale-[0.8] [width:125%]">
        <PaperProvider host={paperHost}>
          <WsxView root={root} />
        </PaperProvider>
      </div>
      <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-background" />
    </div>
  )
}
