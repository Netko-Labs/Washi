import { type CSSProperties, useRef } from 'react'
import { styled } from '../../lib'
import type { WidgetFrameProps, WidgetProps } from '../../lib/types'
import { frameHeight, HTML_WORDS, useWidget } from './lib'

/**
 * One of the page's own components, drawn with React in a frame with no origin of its own and no
 * network (D113): it reaches the page only through `washi`'s hooks, and runs only where an owner
 * turned widgets on. One written as HTML before D113 is a note; its text stays in the source.
 */
export function Widget({ component, ...props }: WidgetProps) {
  if (component) return <WidgetFrame component={component} {...props} />
  const { title, height: _height, args: _args, ...rest } = props
  return (
    <figure {...styled(rest, 'wsx-widget')}>
      <p className="wsx-embed-blocked">
        <span>
          {title && <strong>{title} · </strong>}
          {HTML_WORDS}
        </span>
      </p>
    </figure>
  )
}

function WidgetFrame({ title, height, component, args, ...rest }: WidgetFrameProps) {
  const box = useRef<HTMLElement>(null)
  const frame = useRef<HTMLIFrameElement>(null)
  const { gate, bundle, height: measured, onLoad } = useWidget(frame, component, args)
  const name = title ?? 'A widget'
  const isWaiting = gate === 'asking' || (gate === 'on' && bundle.status === 'building')
  const isReady = gate === 'on' && bundle.status === 'ready'
  const tall = { '--widget-h': `${frameHeight(height, measured)}px` } as CSSProperties

  return (
    <figure ref={box} {...styled(rest, 'wsx-widget')}>
      {isReady && (
        <iframe
          ref={frame}
          title={name}
          sandbox="allow-scripts"
          allow="clipboard-write"
          srcDoc={bundle.document}
          style={tall}
          onLoad={onLoad}
        />
      )}
      {gate === 'off' && (
        <p className="wsx-embed-blocked">
          <span>
            <strong>{name}</strong> runs its own code — widgets are off in this workspace.
          </span>
        </p>
      )}
      {gate === 'on' && bundle.status === 'failed' && (
        <p className="wsx-embed-blocked">
          <span>
            <strong>{name}</strong> can’t draw: {bundle.reason}
          </span>
        </p>
      )}
      {isWaiting && <div className="wsx-embed-wait" style={{ height: height ?? 80 }} />}
      {isReady && (
        <figcaption>
          <span>{title}</span>
          <button
            type="button"
            className="wsx-widget-full"
            aria-label={`Show ${name} full screen`}
            onClick={() => void box.current?.requestFullscreen?.()}
          >
            ⤢ Full screen
          </button>
        </figcaption>
      )}
    </figure>
  )
}
