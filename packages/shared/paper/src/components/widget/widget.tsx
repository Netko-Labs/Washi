import { useMemo, useRef } from 'react'
import { styled } from '../../lib'
import type { WidgetProps } from '../../lib/types'
import { useWidget, widgetDocument } from './lib'

/**
 * A page's own HTML in a frame with no origin of its own and no network: it reaches the page only
 * through `washi.rows / state / setState / act`, and runs only where an owner turned widgets on.
 */
export function Widget({ title, height, source, ...rest }: WidgetProps) {
  const frame = useRef<HTMLIFrameElement>(null)
  const { gate, height: measured, onLoad } = useWidget(frame)
  const document = useMemo(() => widgetDocument(source), [source])

  return (
    <figure {...styled(rest, 'wsx-widget')}>
      {gate === 'on' && (
        <iframe
          ref={frame}
          title={title ?? 'A widget'}
          sandbox="allow-scripts"
          srcDoc={document}
          style={{ height: height ?? measured }}
          onLoad={onLoad}
        />
      )}
      {gate === 'off' && (
        <p className="wsx-embed-blocked">
          <span>
            <strong>{title ?? 'A widget'}</strong> runs its own code — widgets are off in this
            workspace.
          </span>
        </p>
      )}
      {gate === 'asking' && <div className="wsx-embed-wait" style={{ height: height ?? 80 }} />}
      {title && gate === 'on' && <figcaption>{title}</figcaption>}
    </figure>
  )
}
